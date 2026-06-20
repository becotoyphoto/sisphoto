import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createServiceClient } from '@/lib/supabase-service';

// Columns that actually exist in the `profiles` table (see supabase.sql)
const PROFILE_SELECT = 'id, full_name, avatar_url, pix_key, role, is_approved, created_at';

type ProfileRow = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  pix_key: string | null;
  role: string;
  is_approved: boolean;
  created_at: string;
};

type UserMeta = {
  email: string | null;
  bio: string | null;
  phone: string | null;
  portfolio_url: string | null;
};

type EnrichedProfile = ProfileRow & UserMeta & {
  events_count: number;
  photos_count: number;
  status: string;
};

type EventRow = {
  id: string;
  photographer_id: string;
  name: string;
  city: string;
  state: string;
  date: string;
  status: string;
  cover_image_url: string | null;
  created_at: string;
};

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), supabase: null, user: null };
  }

  const service = createServiceClient();
  const { data: profile } = await service
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    return { error: NextResponse.json({ error: 'Not authorized' }, { status: 403 }), supabase: null, user: null };
  }

  return { error: null, supabase, service, user };
}

function mapPhotographerStatus(isApproved: boolean) {
  return isApproved ? 'active' : 'pending';
}

function normalizeOptionalString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Fetch metadata (email, bio, phone, portfolio_url) from auth.users
 * for the given profile IDs. Uses paginated listUsers + user_metadata.
 */
async function getUserMetaBatch(
  service: ReturnType<typeof createServiceClient>,
  userIds: string[],
): Promise<Record<string, UserMeta>> {
  const result: Record<string, UserMeta> = {};

  if (userIds.length === 0) return result;

  const idSet = new Set(userIds);
  let page = 1;
  const perPage = 100;

  while (idSet.size > 0) {
    const { data, error } = await service.auth.admin.listUsers({ page, perPage });

    if (error) {
      console.error('listUsers error:', error.message);
      break;
    }

    if (!data || data.users.length === 0) break;

    for (const u of data.users) {
      if (!idSet.has(u.id)) continue;

      const meta = u.user_metadata || {};

      result[u.id] = {
        email: u.email || null,
        bio: normalizeOptionalString(meta.bio),
        phone: normalizeOptionalString(meta.phone),
        portfolio_url: normalizeOptionalString(meta.portfolio_url),
      };

      idSet.delete(u.id);
    }

    if (data.users.length < perPage) break;
    page++;
  }

  return result;
}

async function getPhotographerMetrics(service: ReturnType<typeof createServiceClient>, photographerIds: string[]) {
  const eventCounts: Record<string, number> = {};
  const photoCounts: Record<string, number> = {};
  const eventsByPhotographer: Record<string, Array<EventRow & { photos_count: number }>> = {};

  if (photographerIds.length === 0) {
    return { eventCounts, photoCounts, eventsByPhotographer };
  }

  const { data: events, error: eventsError } = await service
    .from('events')
    .select('id, photographer_id, name, city, state, date, status, cover_image_url, created_at')
    .in('photographer_id', photographerIds)
    .order('date', { ascending: false });

  if (eventsError) throw new Error(eventsError.message);

  const eventIds = (events || []).map((e) => e.id);
  const photoCountsByEventId: Record<string, number> = {};

  for (const e of (events || []) as EventRow[]) {
    eventCounts[e.photographer_id] = (eventCounts[e.photographer_id] || 0) + 1;
  }

  if (eventIds.length > 0) {
    const { data: photos, error: photosError } = await service
      .from('photos')
      .select('event_id')
      .in('event_id', eventIds);

    if (photosError) throw new Error(photosError.message);

    for (const p of photos || []) {
      photoCountsByEventId[p.event_id] = (photoCountsByEventId[p.event_id] || 0) + 1;
    }
  }

  for (const e of (events || []) as EventRow[]) {
    const count = photoCountsByEventId[e.id] || 0;
    photoCounts[e.photographer_id] = (photoCounts[e.photographer_id] || 0) + count;

    if (!eventsByPhotographer[e.photographer_id]) {
      eventsByPhotographer[e.photographer_id] = [];
    }

    eventsByPhotographer[e.photographer_id].push({ ...e, photos_count: count });
  }

  return { eventCounts, photoCounts, eventsByPhotographer };
}

function enrichProfile(
  profile: ProfileRow,
  meta: UserMeta,
  metrics: { eventCounts: Record<string, number>; photoCounts: Record<string, number> },
): EnrichedProfile {
  return {
    ...profile,
    ...meta,
    events_count: metrics.eventCounts[profile.id] || 0,
    photos_count: metrics.photoCounts[profile.id] || 0,
    status: mapPhotographerStatus(profile.is_approved),
  };
}

// ─── GET ────────────────────────────────────────────────────────────────────
// GET /api/admin/photographers                 → list
// GET /api/admin/photographers?id=uuid          → detail (includes events[])
// GET /api/admin/photographers?status=active|pending
// GET /api/admin/photographers?search=nome
export async function GET(request: Request) {
  const { error, service } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';

  // ── Detail ──
  if (id) {
    const { data: profile, error: profileError } = await service
      .from('profiles')
      .select(PROFILE_SELECT)
      .eq('id', id)
      .eq('role', 'photographer')
      .maybeSingle();

    if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });
    if (!profile) return NextResponse.json({ error: 'Fotógrafo não encontrado' }, { status: 404 });

    try {
      const [metrics, metaMap] = await Promise.all([
        getPhotographerMetrics(service, [profile.id]),
        getUserMetaBatch(service, [profile.id]),
      ]);

      const meta = metaMap[profile.id] || { email: null, bio: null, phone: null, portfolio_url: null };
      const enriched = enrichProfile(profile as ProfileRow, meta, metrics);

      return NextResponse.json({
        ...enriched,
        events: metrics.eventsByPhotographer[profile.id] || [],
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao carregar métricas';
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  }

  // ── List ──
  let query = service
    .from('profiles')
    .select(PROFILE_SELECT)
    .eq('role', 'photographer')
    .order('created_at', { ascending: false });

  if (status === 'active') query = query.eq('is_approved', true);
  if (status === 'pending') query = query.eq('is_approved', false);
  if (search) query = query.ilike('full_name', `%${search}%`);

  const { data: profiles, error: queryError } = await query;
  if (queryError) return NextResponse.json({ error: queryError.message }, { status: 500 });

  const profileList = (profiles || []) as ProfileRow[];
  const ids = profileList.map((p) => p.id);

  try {
    const [metrics, metaMap] = await Promise.all([
      getPhotographerMetrics(service, ids),
      getUserMetaBatch(service, ids),
    ]);

    let result = profileList.map((p) => {
      const meta = metaMap[p.id] || { email: null, bio: null, phone: null, portfolio_url: null };
      return enrichProfile(p, meta, metrics);
    });

    // Post-filter by email if search didn't match names
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (p) =>
          (p.full_name || '').toLowerCase().includes(lower) ||
          (p.email || '').toLowerCase().includes(lower),
      );
    }

    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro ao carregar métricas';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ─── POST ───────────────────────────────────────────────────────────────────
// Create new photographer. Extra fields (bio, phone, portfolio_url) go into
// auth.users user_metadata.
export async function POST(request: Request) {
  const { error, service } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const full_name = normalizeOptionalString(body.full_name);
  const email = normalizeOptionalString(body.email);
  const password = typeof body.password === 'string' ? body.password.trim() : '';
  const bio = normalizeOptionalString(body.bio);
  const phone = normalizeOptionalString(body.phone);
  const portfolio_url = normalizeOptionalString(body.portfolio_url);
  const pix_key = normalizeOptionalString(body.pix_key);

  if (!full_name || !email || !password) {
    return NextResponse.json({ error: 'Nome, email e senha são obrigatórios' }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: 'A senha deve ter pelo menos 6 caracteres' }, { status: 400 });
  }

  // Check duplicate email
  const { data: existingUsers } = await service.auth.admin.listUsers({ page: 1, perPage: 500 });
  if ((existingUsers?.users || []).some((u) => u.email?.toLowerCase() === email.toLowerCase())) {
    return NextResponse.json({ error: 'Email já cadastrado' }, { status: 409 });
  }

  // Create auth user with metadata
  const { data: authUser, error: authError } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name,
      role: 'photographer',
      bio,
      phone,
      portfolio_url,
    },
  });

  if (authError || !authUser.user) {
    return NextResponse.json({ error: authError?.message || 'Erro ao criar usuário' }, { status: 500 });
  }

  // Create profile in public.profiles
  const { data: profile, error: profileError } = await service
    .from('profiles')
    .insert({
      id: authUser.user.id,
      full_name,
      role: 'photographer',
      is_approved: true,
      pix_key,
    })
    .select()
    .single();

  if (profileError) {
    await service.auth.admin.deleteUser(authUser.user.id);
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  return NextResponse.json({
    ...profile,
    email: authUser.user.email,
    bio,
    phone,
    portfolio_url,
    status: 'active',
    events_count: 0,
    photos_count: 0,
  });
}

// ─── PUT ────────────────────────────────────────────────────────────────────
// Approve/reject (action param) or update profile data.
export async function PUT(request: Request) {
  const { error, service } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const photographer_id = typeof body.photographer_id === 'string' ? body.photographer_id : '';
  const action = typeof body.action === 'string' ? body.action : undefined;

  // ── Approve / Reject ──
  if (photographer_id && action) {
    const next = action === 'approve' ? true : action === 'reject' ? false : null;
    if (next === null) return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    const { data, error: updateError } = await service
      .from('profiles')
      .update({ is_approved: next })
      .eq('id', photographer_id)
      .eq('role', 'photographer')
      .select(PROFILE_SELECT)
      .maybeSingle();

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: 'Fotógrafo não encontrado' }, { status: 404 });

    const metaMap = await getUserMetaBatch(service, [data.id]);
    const meta = metaMap[data.id] || { email: null, bio: null, phone: null, portfolio_url: null };

    return NextResponse.json({
      ...data,
      ...meta,
      status: mapPhotographerStatus(data.is_approved),
    });
  }

  // ── Update profile ──
  if (photographer_id) {
    const full_name = normalizeOptionalString(body.full_name);
    const email = normalizeOptionalString(body.email);
    const bio = normalizeOptionalString(body.bio);
    const phone = normalizeOptionalString(body.phone);
    const portfolio_url = normalizeOptionalString(body.portfolio_url);
    const pix_key = normalizeOptionalString(body.pix_key);

    // Build profile-only update (pix_key, full_name)
    const profileUpdates: Record<string, unknown> = {};
    if (full_name) profileUpdates.full_name = full_name;
    if (pix_key !== undefined) profileUpdates.pix_key = pix_key;

    // Build auth user_metadata update
    const metaUpdates: Record<string, unknown> = {};
    if (full_name) metaUpdates.full_name = full_name;
    metaUpdates.role = 'photographer';
    if (bio !== null) metaUpdates.bio = bio;
    if (phone !== null) metaUpdates.phone = phone;
    if (portfolio_url !== null) metaUpdates.portfolio_url = portfolio_url;

    if (Object.keys(profileUpdates).length === 0 && !email && Object.keys(metaUpdates).length <= 1) {
      return NextResponse.json({ error: 'Nenhum dado para atualizar' }, { status: 400 });
    }

    // Update auth user (email + metadata)
    const { error: authUpdateError } = await service.auth.admin.updateUserById(photographer_id, {
      ...(email ? { email } : {}),
      user_metadata: metaUpdates,
    });

    if (authUpdateError) {
      return NextResponse.json({ error: `Erro ao atualizar auth: ${authUpdateError.message}` }, { status: 500 });
    }

    // Update profile table
    if (Object.keys(profileUpdates).length > 0) {
      const { error: profileUpdateError } = await service
        .from('profiles')
        .update(profileUpdates)
        .eq('id', photographer_id)
        .eq('role', 'photographer');

      if (profileUpdateError) {
        return NextResponse.json({ error: profileUpdateError.message }, { status: 500 });
      }
    }

    // Fetch updated data
    const { data: updated } = await service
      .from('profiles')
      .select(PROFILE_SELECT)
      .eq('id', photographer_id)
      .eq('role', 'photographer')
      .maybeSingle();

    if (!updated) return NextResponse.json({ error: 'Fotógrafo não encontrado' }, { status: 404 });

    const metaMap = await getUserMetaBatch(service, [updated.id]);
    const meta = metaMap[updated.id] || { email: null, bio: null, phone: null, portfolio_url: null };

    return NextResponse.json({
      ...updated,
      ...meta,
      status: mapPhotographerStatus(updated.is_approved),
    });
  }

  return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
}

// ─── DELETE ─────────────────────────────────────────────────────────────────
export async function DELETE(request: Request) {
  const { error, service } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing photographer id' }, { status: 400 });

  const { data: events } = await service
    .from('events')
    .select('id')
    .eq('photographer_id', id);

  if (events && events.length > 0) {
    return NextResponse.json({
      error: `Fotógrafo possui ${events.length} evento(s). Remova os eventos primeiro.`,
    }, { status: 400 });
  }

  await service.from('profiles').delete().eq('id', id);
  await service.auth.admin.deleteUser(id);

  return NextResponse.json({ success: true });
}
