import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
const MAX_FILE_SIZE_MB = 20;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

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

    // Validação de tipo MIME real (não apenas extensão)
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Tipo de arquivo não permitido. Use: ${ALLOWED_MIME_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // Validação de tamanho
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: `Arquivo muito grande. Máximo: ${MAX_FILE_SIZE_MB}MB` },
        { status: 400 }
      );
    }

    // Validação do tipo de upload
    if (!['watermark', 'original'].includes(type)) {
      return NextResponse.json({ error: 'Tipo de upload inválido' }, { status: 400 });
    }

    const bucket = type === 'watermark' ? 'photos' : 'originals';
    const ext = file.type.split('/')[1].replace('jpeg', 'jpg');
    const fileName = `${eventId}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error('Erro no upload:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ path: data.path });
  } catch (error) {
    console.error('Erro no upload:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
