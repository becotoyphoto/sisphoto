import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase-server';
import { createServiceClient } from '@/lib/supabase-service';

// #region debug-point upload-1
const DEBUG_SERVER_URL = process.env.DEBUG_SERVER_URL || 'http://127.0.0.1:7777/event';
const DEBUG_SESSION_ID = process.env.DEBUG_SESSION_ID || 'photos-not-appearing-dashboard';
async function debugLog(event: string, data: Record<string, unknown>) {
  try {
    await fetch(DEBUG_SERVER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session: DEBUG_SESSION_ID, event, ...data, timestamp: new Date().toISOString() }),
    });
  } catch {}
}
// #endregion debug-point upload-1

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
const MAX_FILE_SIZE_MB = 20;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const { user } = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const eventId = formData.get('eventId') as string;
    const type = formData.get('type') as 'watermark' | 'original';

    if (!file || !eventId || !type) {
      return NextResponse.json({ error: 'Parâmetros obrigatórios ausentes' }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Tipo de arquivo não permitido. Use: ${ALLOWED_MIME_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: `Arquivo muito grande. Máximo: ${MAX_FILE_SIZE_MB}MB` },
        { status: 400 }
      );
    }

    if (!['watermark', 'original'].includes(type)) {
      return NextResponse.json({ error: 'Tipo de upload inválido' }, { status: 400 });
    }

    const service = createServiceClient();
    const { data: profile } = await service
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const { data: event, error: eventError } = await service
      .from('events')
      .select('photographer_id')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 });
    }

    if (event.photographer_id !== user.id && profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Sem permissão para enviar fotos neste evento' }, { status: 403 });
    }

    const bucket = type === 'watermark' ? 'photos' : 'originals';
    const ext = file.type.split('/')[1].replace('jpeg', 'jpg');
    const fileName = `${eventId}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data, error } = await service.storage
      .from(bucket)
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    // #region debug-point upload-2
    await debugLog('upload-storage-result', {
      userId: user.id,
      eventId,
      type,
      bucket,
      fileName,
      success: !error,
      error: error?.message,
      path: data?.path,
    });
    // #endregion debug-point upload-2

    if (error) {
      console.error('Upload error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ path: data.path });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
