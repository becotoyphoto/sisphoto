import { NextResponse } from 'next/server';
import { createServiceClient, isServiceRoleConfigured } from '@/lib/supabase-service';

export async function POST(request: Request) {
  try {
    const { email, password, full_name, phone, city } = await request.json();

    if (!email || !password || !full_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!isServiceRoleConfigured()) {
      return NextResponse.json(
        { error: 'SUPABASE_SERVICE_ROLE_KEY não configurada. Atualize o .env.local.' },
        { status: 500 }
      );
    }

    const supabase = createServiceClient();

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
        phone,
        city,
        role: 'photographer',
      },
    });

    if (error) {
      console.error('Signup error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: data.user.id,
          full_name,
          role: 'photographer',
          is_approved: false,
          created_at: new Date().toISOString(),
        })

      if (profileError) {
        console.error('Profile update error:', profileError);
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Photographer registration submitted for approval' 
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
