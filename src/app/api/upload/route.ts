import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    const traceId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const eventId = formData.get('eventId') as string;
    const type = formData.get('type') as 'watermark' | 'original';

    if (!file || !eventId || !type) {
      // #region debug-point B:upload-missing-params
      fetch('http://127.0.0.1:7777/event',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'photo-upload-missing',runId:'pre-fix',hypothesisId:'B',traceId,location:'api/upload/route.ts:params',msg:'[DEBUG] upload rejected due to missing params',data:{hasFile:Boolean(file),eventId,type},ts:Date.now()})}).catch(()=>{});
      // #endregion
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const bucket = type === 'watermark' ? 'photos' : 'originals';
    const fileName = `${eventId}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.jpg`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, buffer, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // #region debug-point B:upload-storage-success
    fetch('http://127.0.0.1:7777/event',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'photo-upload-missing',runId:'pre-fix',hypothesisId:'B',traceId,location:'api/upload/route.ts:storage-success',msg:'[DEBUG] storage upload succeeded',data:{bucket,path:data.path},ts:Date.now()})}).catch(()=>{});
    // #endregion
    return NextResponse.json({ path: data.path });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
