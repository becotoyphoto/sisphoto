'use client';

import { useState, useRef, useCallback } from 'react';
import { Camera, Upload, X, Check, Loader2, ArrowLeft, Image, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { applyWatermarkToCanvas, blobToFile } from '@/lib/watermark';

interface PhotoUpload {
  id: string;
  originalFile: File;
  watermarkFile?: File;
  preview: string;
  status: 'pending' | 'processing' | 'uploading' | 'done' | 'error';
  error?: string;
}

export default function EventUploadPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [photos, setPhotos] = useState<PhotoUpload[]>([]);
  const [price, setPrice] = useState('15.00');
  const [isUploading, setIsUploading] = useState(false);

  const processFile = async (file: File): Promise<PhotoUpload> => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const preview = URL.createObjectURL(file);
    
    return {
      id,
      originalFile: file,
      preview,
      status: 'pending',
    };
  };

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    const newPhotos: PhotoUpload[] = [];
    for (const file of files) {
      if (file.type.startsWith('image/')) {
        const photo = await processFile(file);
        newPhotos.push(photo);
      }
    }
    
    setPhotos(prev => [...prev, ...newPhotos]);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const applyWatermarkToPhoto = async (photo: PhotoUpload): Promise<PhotoUpload> => {
    try {
      // #region debug-point A:watermark-start
      fetch('http://127.0.0.1:7777/event',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'photo-upload-missing',runId:'pre-fix',hypothesisId:'A',location:'dashboard/fotografo/eventos/[id]/page.tsx:applyWatermarkToPhoto:start',msg:'[DEBUG] watermark processing started',data:{photoId:photo.id,fileName:photo.originalFile.name,size:photo.originalFile.size,type:photo.originalFile.type},ts:Date.now()})}).catch(()=>{});
      // #endregion
      const watermarkBlob = await applyWatermarkToCanvas(photo.originalFile, {
        text: 'SisPhoto',
        opacity: 0.25,
        fontSize: 48,
      });
      
      const watermarkFile = blobToFile(watermarkBlob, photo.originalFile.name);
      // #region debug-point A:watermark-success
      fetch('http://127.0.0.1:7777/event',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'photo-upload-missing',runId:'pre-fix',hypothesisId:'A',location:'dashboard/fotografo/eventos/[id]/page.tsx:applyWatermarkToPhoto:success',msg:'[DEBUG] watermark processing finished',data:{photoId:photo.id,fileName:photo.originalFile.name,outputSize:watermarkFile.size,outputType:watermarkFile.type},ts:Date.now()})}).catch(()=>{});
      // #endregion
      
      return {
        ...photo,
        watermarkFile,
        status: 'pending',
      };
    } catch (error) {
      // #region debug-point A:watermark-error
      fetch('http://127.0.0.1:7777/event',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'photo-upload-missing',runId:'pre-fix',hypothesisId:'A',location:'dashboard/fotografo/eventos/[id]/page.tsx:applyWatermarkToPhoto:error',msg:'[DEBUG] watermark processing failed',data:{photoId:photo.id,fileName:photo.originalFile.name,error:error instanceof Error ? error.message : String(error)},ts:Date.now()})}).catch(()=>{});
      // #endregion
      return {
        ...photo,
        status: 'error',
        error: 'Falha ao processar marca d\'água',
      };
    }
  };

  const handleApplyWatermarks = async () => {
    const photosToProcess = photos.filter(p => p.status === 'pending' || p.status === 'error');
    // #region debug-point A:watermark-batch
    fetch('http://127.0.0.1:7777/event',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'photo-upload-missing',runId:'pre-fix',hypothesisId:'A',location:'dashboard/fotografo/eventos/[id]/page.tsx:handleApplyWatermarks',msg:'[DEBUG] watermark batch triggered',data:{eventId:id,selectedCount:photos.length,toProcessCount:photosToProcess.length},ts:Date.now()})}).catch(()=>{});
    // #endregion
    
    for (const photo of photosToProcess) {
      setPhotos(prev => prev.map(p => 
        p.id === photo.id ? { ...p, status: 'processing' } : p
      ));
      
      const processed = await applyWatermarkToPhoto(photo);
      
      setPhotos(prev => prev.map(p => 
        p.id === photo.id ? processed : p
      ));
    }
  };

  const uploadPhoto = async (photo: PhotoUpload): Promise<boolean> => {
    if (!photo.watermarkFile) return false;
    
    try {
      const traceId = `${photo.id}-${Date.now()}`;
      const formDataOriginal = new FormData();
      formDataOriginal.append('file', photo.originalFile);
      formDataOriginal.append('eventId', id as string);
      formDataOriginal.append('type', 'original');
      
      const resOriginal = await fetch('/api/upload', {
        method: 'POST',
        body: formDataOriginal,
      });
      // #region debug-point B:upload-original-response
      fetch('http://127.0.0.1:7777/event',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'photo-upload-missing',runId:'pre-fix',hypothesisId:'B',traceId,location:'dashboard/fotografo/eventos/[id]/page.tsx:uploadPhoto:original-response',msg:'[DEBUG] original upload response received',data:{ok:resOriginal.ok,status:resOriginal.status},ts:Date.now()})}).catch(()=>{});
      // #endregion
      
      if (!resOriginal.ok) return false;
      const { path: originalPath } = await resOriginal.json();

      const formDataWatermark = new FormData();
      formDataWatermark.append('file', photo.watermarkFile);
      formDataWatermark.append('eventId', id as string);
      formDataWatermark.append('type', 'watermark');
      
      const resWatermark = await fetch('/api/upload', {
        method: 'POST',
        body: formDataWatermark,
      });
      // #region debug-point B:upload-watermark-response
      fetch('http://127.0.0.1:7777/event',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'photo-upload-missing',runId:'pre-fix',hypothesisId:'B',traceId,location:'dashboard/fotografo/eventos/[id]/page.tsx:uploadPhoto:watermark-response',msg:'[DEBUG] watermark upload response received',data:{ok:resWatermark.ok,status:resWatermark.status,originalPath},ts:Date.now()})}).catch(()=>{});
      // #endregion
      
      if (!resWatermark.ok) return false;
      const { path: watermarkPath } = await resWatermark.json();

      const photoRes = await fetch('/api/photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: id,
          storage_path_original: originalPath,
          storage_path_watermark: watermarkPath,
          price: parseFloat(price),
        }),
      });
      
      return photoRes.ok;
    } catch (error) {
      // #region debug-point B:upload-error
      fetch('http://127.0.0.1:7777/event',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'photo-upload-missing',runId:'pre-fix',hypothesisId:'B',location:'dashboard/fotografo/eventos/[id]/page.tsx:uploadPhoto:error',msg:'[DEBUG] upload request failed',data:{photoId:photo.id,fileName:photo.originalFile.name,error:error instanceof Error ? error.message : String(error)},ts:Date.now()})}).catch(()=>{});
      // #endregion
      console.error('Upload error:', error);
      return false;
    }
  };

  const handleUploadAll = async () => {
    const photosToUpload = photos.filter(p => p.status === 'pending' && p.watermarkFile);
    
    if (photosToUpload.length === 0) {
      alert('Nenhuma foto com marca d\'água pronta para upload');
      return;
    }
    
    setIsUploading(true);
    
    for (const photo of photosToUpload) {
      setPhotos(prev => prev.map(p => 
        p.id === photo.id ? { ...p, status: 'uploading' } : p
      ));
      
      const success = await uploadPhoto(photo);
      
      setPhotos(prev => prev.map(p => 
        p.id === photo.id ? { ...p, status: success ? 'done' : 'error', error: success ? undefined : 'Erro no upload' } : p
      ));
    }
    
    setIsUploading(false);
  };

  const removePhoto = (photoId: string) => {
    setPhotos(prev => {
      const photo = prev.find(p => p.id === photoId);
      if (photo) {
        URL.revokeObjectURL(photo.preview);
      }
      return prev.filter(p => p.id !== photoId);
    });
  };

  const pendingWithoutWatermark = photos.filter(p => p.status === 'pending' && !p.watermarkFile).length;
  const readyCount = photos.filter(p => p.status === 'pending' && p.watermarkFile).length;
  const doneCount = photos.filter(p => p.status === 'done').length;
  const allWatermarked = pendingWithoutWatermark === 0 && photos.some(p => p.watermarkFile);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Link 
        href="/dashboard/fotografo"
        className="inline-flex items-center gap-2 text-primary hover:underline mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para dashboard
      </Link>

      <div className="bg-card border border-white/10 rounded-2xl p-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-primary/10 rounded-xl">
            <Upload className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Upload de Fotos</h1>
            <p className="text-muted-foreground">Adicione fotos ao evento e aplique marca d&apos;água automaticamente</p>
          </div>
        </div>

        {/* Price Setting */}
        <div className="mb-8 p-4 bg-white/5 rounded-xl">
          <label className="block text-sm font-medium mb-2">Preço por foto (R$)</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full md:w-48 bg-white/5 border border-white/10 rounded-xl py-2 px-4 focus:ring-2 focus:ring-primary focus:outline-none"
          />
        </div>

        {/* Upload Area */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-white/20 rounded-2xl p-12 text-center cursor-pointer hover:border-primary/50 transition-colors mb-8"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          <Camera className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium mb-2">Clique ou arraste fotos aqui</p>
          <p className="text-sm text-muted-foreground">Formatos: JPG, PNG, WebP</p>
        </div>

        {/* Photos Grid */}
        {photos.length > 0 && (
          <div className="mb-8">
            <h3 className="font-bold mb-4">{photos.length} fotos selecionadas</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {photos.map((photo) => (
                <div key={photo.id} className="relative aspect-square bg-white/5 rounded-xl overflow-hidden">
                  <img
                    src={photo.preview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Status Overlay */}
                  {photo.status === 'processing' && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  )}
                  
                  {photo.status === 'uploading' && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
                    </div>
                  )}
                  
                  {photo.status === 'done' && (
                    <div className="absolute inset-0 bg-green-500/60 flex items-center justify-center">
                      <Check className="h-8 w-8 text-white" />
                    </div>
                  )}
                  
                  {photo.status === 'error' && (
                    <div className="absolute inset-0 bg-red-500/60 flex items-center justify-center">
                      <X className="h-8 w-8 text-white" />
                    </div>
                  )}
                  
                  {/* Remove Button */}
                  <button
                    onClick={() => removePhoto(photo.id)}
                    className="absolute top-2 right-2 p-1 bg-black/60 hover:bg-red-500 rounded-full transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        {photos.length > 0 && (
          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleApplyWatermarks}
              disabled={pendingWithoutWatermark === 0 || isUploading}
              className="flex items-center gap-2 bg-secondary hover:bg-secondary/90 px-6 py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
            >
              <Image className="h-5 w-5" />
              {allWatermarked ? '✓ Marca d\'Água Aplicada' : `Aplicar Marca d'Água (${pendingWithoutWatermark})`}
            </button>
            
            <button
              onClick={handleUploadAll}
              disabled={readyCount === 0 || isUploading}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 px-6 py-3 rounded-xl font-bold transition-colors disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5" />
                  Enviar para o Servidor ({readyCount})
                </>
              )}
            </button>
          </div>
        )}

        {/* Done Message */}
        {doneCount > 0 && (
          <div className="mt-8 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
            <p className="text-green-500 font-medium">
              {doneCount} foto(s) enviada(s) com sucesso!
            </p>
            <Link
              href={`/evento/${id}`}
              className="text-sm text-primary hover:underline mt-2 inline-block"
            >
              Ver evento publicado
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
