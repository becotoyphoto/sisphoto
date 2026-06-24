import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  const cookieStore = await cookies();
  const pixDataStr = cookieStore.get('sisphoto_pix_session')?.value;
  
  if (!pixDataStr) {
    return NextResponse.json({ pixData: null });
  }

  try {
    const pixData = JSON.parse(pixDataStr);
    return NextResponse.json({ pixData });
  } catch {
    return NextResponse.json({ pixData: null });
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  const cookieStore = await cookies();
  
  cookieStore.set('sisphoto_pix_session', JSON.stringify(body), {
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
