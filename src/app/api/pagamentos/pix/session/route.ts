import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const cookieStore = await cookies();
  const pixDataStr = cookieStore.get('sisphoto_pix_session')?.value;
  
  if (!pixDataStr || !user) {
    return NextResponse.json({ pixData: null });
  }

  try {
    const pixData = JSON.parse(pixDataStr);
    
    // Verificação de segurança: garante que o cookie pertence ao usuário atual
    if (pixData.userId !== user.id) {
      return NextResponse.json({ pixData: null });
    }
    
    return NextResponse.json({ pixData });
  } catch {
    return NextResponse.json({ pixData: null });
  }
}

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  // Anexa o ID do usuário ao payload
  const payload = { ...body, userId: user.id };

  const cookieStore = await cookies();
  
  cookieStore.set('sisphoto_pix_session', JSON.stringify(payload), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 // 1 dia
  });

  return NextResponse.json({ success: true });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete('sisphoto_pix_session');
  return NextResponse.json({ success: true });
}
