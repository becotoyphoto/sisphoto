'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, Upload, X, Check, Loader2, ArrowLeft, Image as ImageIcon, Trash2 } from 'lucide-react';
import Link from 'next/link';
import NextImage from 'next/image';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { applyWatermarkToCanvas, blobToFile } from '@/lib/watermark';
import { createClient } from '@/lib/supabase-client';

// #region debug-point upload-page-1
const DEBUG_SERVER_URL = process.env.NEXT_PUBLIC_DEBUG_SERVER_URL || 'http://127.0.0.1:7777/event';
const DEBUG_SESSION_ID = 'photos-not-appearing-dashboard';
async function debugLog(event: string, data: Record<string, unknown>) {
  try {
    await fetch(DEBUG_SERVER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session: DEBUG_SESSION_ID, event, ...data, timestamp: new Date().toISOString() }),
    });
  } catch {}
}
// #endregion debug-point upload-page-1

interface PhotoUpload {
  id: string;
  originalFile: File;
  watermarkFile?: File;
  preview: string;
  status: 'pending' | 'processing' | 'uploading' | 'done' | 'error';
  error?: string;
}

interface ExistingPhoto {
  id: string;
  previewUrl: string;
  originalPath?: string;
  watermarkPath?: string;
}

export default function EventUploadPage() {
  const { id } = useParams();
  const { user, profile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const existingPhotosRef = useRef<HTMLDivElement>(null);
  
  const [photos, setPhotos] = useState<PhotoUpload[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<ExistingPhoto[]>([]);
  const [price, setPrice] = useState('15.00');
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingExisting, setIsLoadingExisting] = useState(true);
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);
  const [ignoredFiles, setIgnoredFiles] = useState<string[]>([]);
  const [duplicateFiles, setDuplicateFiles] = useState<string[]>([]);
  const [accessDenied, setAccessDenied] = useState(false);
  const [showCoverModal, setShowCoverModal] = useState(false);
  const [justUploadedPhotos, setJustUploadedPhotos] = useState<{ id: string; previewUrl: string; watermarkPath: string }[]>([]);
  const [selectedCoverPhotoId, setSelectedCoverPhotoId] = useState<string | null>(null);
  const [savingCover, setSavingCover] = useState(false);

  const getFileFingerprint = (file: File) => `${file.name}:${file.size}:${file.lastModified}`;

  const loadExistingPhotos = useCallback(async () => {
    try {
      setIsLoadingExisting(true);
      const response = await fetch(`/api/photos?eventId=${id}`);
      const data = await response.json();

      // #region debug-point upload-page-2
      await debugLog('upload-page-load-existing', {
        eventId: id,
        ok: response.ok,
        status: response.status,
        isArray: Array.isArray(data),
        count: Array.isArray(data) ? data.length : 0,
        payload: Array.isArray(data) ? data.map((photo: { id: string }) => photo.id) : data,
      });
      // #endregion debug-point upload-page-2

      if (!response.ok || !Array.isArray(data)) {
        setExistingPhotos([]);
        return;
      }

      const signedPhotos = await Promise.all(
        data.map(async (photo: { id: string; storage_path_original?: string; storage_path_watermark?: string }) => {
          let previewUrl = '';

          if (photo.storage_path_watermark) {
            const signedResponse = await fetch('/api/signed-url', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ path: photo.storage_path_watermark, bucket: 'photos' }),
            });
            const signedData = await signedResponse.json().catch(() => ({}));
            previewUrl = signedData.url || '';
          }

          return {
            id: photo.id,
            previewUrl,
            originalPath: photo.storage_path_original,
            watermarkPath: photo.storage_path_watermark,
          };
        })
      );

      setExistingPhotos(signedPhotos.filter((photo) => photo.previewUrl));
    } catch (error) {
      console.error('Error loading existing photos:', error);
      setExistingPhotos([]);
    } finally {
      setIsLoadingExisting(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      const timeoutId = window.setTimeout(() => {
        void loadExistingPhotos();
      }, 0);

      return () => {
        window.clearTimeout(timeoutId);
      };
    }
  }, [id, loadExistingPhotos]);

  // Verifica se o evento pertence ao fotógrafo logado
  useEffect(() => {
    if (!id || !user) return;
    fetch(`/api/event?id=${id}`)
      .then(res => res.ok ? res.json() : null)
      .then(evt => {
        if (evt && evt.photographer_id !== user.id && profile?.role !== 'admin') {
          setAccessDenied(true);
        }
      })
      .catch(() => {});
  }, [id, user, profile]);

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
    const invalidFileNames: string[] = [];
    const duplicateFileNames: string[] = [];
    const selectedFingerprints = new Set<string>();
    
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        invalidFileNames.push(file.name);
        continue;
      }

      const fingerprint = getFileFingerprint(file);
      if (selectedFingerprints.has(fingerprint)) {
        duplicateFileNames.push(file.name);
        continue;
      }

      selectedFingerprints.add(fingerprint);
      if (file.type.startsWith('image/')) {
        const photo = await processFile(file);
        newPhotos.push(photo);
      }
    }
    
    const duplicateNamesToShow = [...duplicateFileNames];

    setPhotos(prev => {
      const existingFingerprints = new Set(prev.map((photo) => getFileFingerprint(photo.originalFile)));
      const uniqueNewPhotos: PhotoUpload[] = [];

      for (const photo of newPhotos) {
        const fingerprint = getFileFingerprint(photo.originalFile);

        if (existingFingerprints.has(fingerprint)) {
          duplicateNamesToShow.push(photo.originalFile.name);
          URL.revokeObjectURL(photo.preview);
          continue;
        }

        existingFingerprints.add(fingerprint);
        uniqueNewPhotos.push(photo);
      }

      return [...prev, ...uniqueNewPhotos];
    });
    
    if (invalidFileNames.length > 0) {
      setIgnoredFiles(invalidFileNames);
      // Auto-hide the message after 5 seconds
      setTimeout(() => setIgnoredFiles([]), 5000);
    }

    if (duplicateNamesToShow.length > 0) {
      setDuplicateFiles(Array.from(new Set(duplicateNamesToShow)));
      setTimeout(() => setDuplicateFiles([]), 5000);
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const applyWatermarkToPhoto = async (photo: PhotoUpload): Promise<PhotoUpload> => {
    try {
      const watermarkBlob = await applyWatermarkToCanvas(photo.originalFile, {
        text: 'BecoToy.com',
        opacity: 0.26,
        fontSize: 48,
      });

      const watermarkFile = blobToFile(watermarkBlob, photo.originalFile.name);

      return {
        ...photo,
        watermarkFile,
        status: 'pending',
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao processar marca d\'água';
      console.error('Watermark error:', err);
      return {
        ...photo,
        status: 'error',
        error: message,
      };
    }
  };

  const handleApplyWatermarks = async () => {
    const photosToProcess = photos.filter(p => p.status === 'pending' || p.status === 'error');

    // Marca as fotos selecionadas como 'processing' de uma só vez para feedback visual
    setPhotos(prev => prev.map(p => 
      photosToProcess.some(toProcess => toProcess.id === p.id) 
        ? { ...p, status: 'processing' } 
        : p
    ));

    const CHUNK_SIZE = 3;

    // Processa em lotes (chunks) para evitar sobrecarga de memória (concurrency limit)
    for (let i = 0; i < photosToProcess.length; i += CHUNK_SIZE) {
      const chunk = photosToProcess.slice(i, i + CHUNK_SIZE);
      const chunkResults = await Promise.all(
        chunk.map(photo => applyWatermarkToPhoto(photo))
      );
      
      // Atualiza o estado da UI imediatamente ao final de CADA lote (chunk)
      // O uso da função (prev => ...) garante que não há sobrescrita de estado entre os lotes
      setPhotos(prev => prev.map(p => {
        const updated = chunkResults.find(r => r.id === p.id);
        return updated || p;
      }));
    }
  };

  const uploadPhoto = async (photo: PhotoUpload): Promise<{ success: boolean; error?: string; photoId?: string; watermarkPath?: string }> => {
    if (!photo.watermarkFile) return { success: false, error: 'Marca d\'água não aplicada' };

    try {
      const ext = photo.originalFile.type.split('/')[1].replace('jpeg', 'jpg');
      const baseFileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${ext}`;
      
      const originalPath = `${id}/${baseFileName}`;
      const watermarkPath = `${id}/${baseFileName}`;

      const supabase = createClient();

      const { error: originalError } = await supabase.storage
        .from('originals')
        .upload(originalPath, photo.originalFile, {
          contentType: photo.originalFile.type,
          upsert: false,
        });

      if (originalError) {
        return { success: false, error: originalError.message || `Falha no upload original` };
      }

      const { error: watermarkError } = await supabase.storage
        .from('photos')
        .upload(watermarkPath, photo.watermarkFile, {
          contentType: photo.watermarkFile.type,
          upsert: false,
        });

      if (watermarkError) {
        return { success: false, error: watermarkError.message || `Falha no upload com marca d'água` };
      }

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

      if (!photoRes.ok) {
        const err = await photoRes.json().catch(() => ({}));
        // #region debug-point upload-page-3
        await debugLog('upload-page-photo-register-failed', {
          eventId: id,
          originalPath,
          watermarkPath,
          status: photoRes.status,
          error: err.error || null,
        });
        // #endregion debug-point upload-page-3
        return { success: false, error: err.error || `Falha ao registrar foto (${photoRes.status})` };
      }

      const createdPhoto = await photoRes.json().catch(() => ({}));

      // #region debug-point upload-page-4
      await debugLog('upload-page-photo-register-success', {
        eventId: id,
        originalPath,
        watermarkPath,
        photoId: createdPhoto?.id ?? null,
      });
      // #endregion debug-point upload-page-4

      await loadExistingPhotos();

      return { success: true, photoId: createdPhoto?.id, watermarkPath };
    } catch (error) {
      console.error('Upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido no upload',
      };
    }
  };

  const handleUploadAll = async () => {
    const photosToUpload = photos.filter(p => p.status === 'pending' && p.watermarkFile);
    
    if (photosToUpload.length === 0) {
      alert('Nenhuma foto com marca d\'água pronta para upload');
      return;
    }
    
    setIsUploading(true);
    const uploadedBatch: { id: string; previewUrl: string; watermarkPath: string }[] = [];
    
    for (const photo of photosToUpload) {
      setPhotos(prev => prev.map(p => 
        p.id === photo.id ? { ...p, status: 'uploading' } : p
      ));
      
      const result = await uploadPhoto(photo);

      setPhotos(prev => prev.map(p =>
        p.id === photo.id ? { ...p, status: result.success ? 'done' : 'error', error: result.error } : p
      ));

      if (result.success && result.photoId && result.watermarkPath) {
        const signedRes = await fetch('/api/signed-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: result.watermarkPath, bucket: 'photos' }),
        });
        const signedData = await signedRes.json().catch(() => ({}));
        uploadedBatch.push({
          id: result.photoId,
          previewUrl: signedData.url || photo.preview,
          watermarkPath: result.watermarkPath,
        });
      }
    }
    
    setIsUploading(false);

    if (uploadedBatch.length > 0) {
      setJustUploadedPhotos(uploadedBatch);
      setSelectedCoverPhotoId(uploadedBatch[0].id);
      setShowCoverModal(true);
    }
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

  const clearQueuedPhotos = useCallback(() => {
    setPhotos((prev) => {
      prev.forEach((photo) => URL.revokeObjectURL(photo.preview));
      return [];
    });
  }, []);

  const handleUploadMore = useCallback(() => {
    clearQueuedPhotos();
    setTimeout(() => {
      fileInputRef.current?.click();
    }, 0);
  }, [clearQueuedPhotos]);

  const handleViewUploadedPhotos = useCallback(() => {
    clearQueuedPhotos();
    existingPhotosRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [clearQueuedPhotos]);

  const getPublicUrl = (storagePath: string) => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    return `${supabaseUrl}/storage/v1/object/public/photos/${storagePath}`;
  };

  const handleConfirmCover = useCallback(async () => {
    if (!selectedCoverPhotoId) return;
    setSavingCover(true);
    try {
      const selectedPhoto = justUploadedPhotos.find(p => p.id === selectedCoverPhotoId);
      if (selectedPhoto) {
        await fetch(`/api/events/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cover_image_url: getPublicUrl(selectedPhoto.watermarkPath) }),
        });
      }
    } catch (err) {
      console.error('Erro ao salvar capa:', err);
    } finally {
      setSavingCover(false);
      setShowCoverModal(false);
      clearQueuedPhotos();
    }
  }, [selectedCoverPhotoId, justUploadedPhotos, id, clearQueuedPhotos]);

  const handleSkipCover = useCallback(async () => {
    if (justUploadedPhotos.length > 0) {
      setSavingCover(true);
      try {
        const firstPhoto = justUploadedPhotos[0];
        await fetch(`/api/events/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cover_image_url: getPublicUrl(firstPhoto.watermarkPath) }),
        });
      } catch (err) {
        console.error('Erro ao salvar capa padrão:', err);
      } finally {
        setSavingCover(false);
      }
    }
    setShowCoverModal(false);
    clearQueuedPhotos();
  }, [justUploadedPhotos, id, clearQueuedPhotos]);

  const handleDeleteExistingPhoto = async (photoId: string) => {
    const confirmed = window.confirm('Excluir esta foto do evento?');

    if (!confirmed) {
      return;
    }

    setDeletingPhotoId(photoId);
    try {
      const response = await fetch(`/api/photos?id=${photoId}`, {
        method: 'DELETE',
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        alert(data.error || 'Nao foi possivel excluir a foto.');
        return;
      }

      setExistingPhotos((prev) => prev.filter((photo) => photo.id !== photoId));
    } catch (error) {
      console.error('Error deleting photo:', error);
      alert('Erro ao excluir foto.');
    } finally {
      setDeletingPhotoId(null);
    }
  };

  const pendingWithoutWatermark = photos.filter(p => p.status === 'pending' && !p.watermarkFile).length;
  const readyCount = photos.filter(p => p.status === 'pending' && p.watermarkFile).length;
  const doneCount = photos.filter(p => p.status === 'done').length;
  const allWatermarked = pendingWithoutWatermark === 0 && photos.some(p => p.watermarkFile);
  const uploadCompletedSuccessfully = photos.length > 0 && photos.every((photo) => photo.status === 'done');

  useEffect(() => {
    // #region debug-point upload-page-5
    void debugLog('upload-page-state', {
      eventId: id,
      queuedCount: photos.length,
      existingCount: existingPhotos.length,
      doneCount,
      readyCount,
      pendingWithoutWatermark,
      isUploading,
      isLoadingExisting,
    });
    // #endregion debug-point upload-page-5
  }, [doneCount, existingPhotos.length, id, isLoadingExisting, isUploading, pendingWithoutWatermark, photos.length, readyCount]);

  if (accessDenied) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="bg-card border border-white/10 p-8 rounded-2xl">
          <Camera className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Acesso Restrito</h1>
          <p className="text-muted-foreground mb-6">Você não tem permissão para gerenciar fotos deste evento.</p>
          <Link 
            href="/dashboard/fotografo"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 px-6 py-3 rounded-full font-medium transition-colors"
          >
            Voltar para dashboard
          </Link>
        </div>
      </div>
    );
  }

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

        {/* Ignored Files Warning */}
        {ignoredFiles.length > 0 && (
          <div className="mb-8 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-start justify-between">
            <div>
              <p className="text-yellow-500 font-medium mb-1">
                {ignoredFiles.length} arquivo(s) ignorado(s) por não serem imagens válidas:
              </p>
              <p className="text-sm text-yellow-500/80">
                {ignoredFiles.join(', ')}
              </p>
            </div>
            <button 
              onClick={() => setIgnoredFiles([])}
              className="text-yellow-500 hover:text-yellow-400 p-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {duplicateFiles.length > 0 && (
          <div className="mb-8 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start justify-between">
            <div>
              <p className="text-amber-400 font-medium mb-1">
                {duplicateFiles.length} arquivo(s) ignorado(s) por já estarem na fila:
              </p>
              <p className="text-sm text-amber-300/80">
                {duplicateFiles.join(', ')}
              </p>
            </div>
            <button
              onClick={() => setDuplicateFiles([])}
              className="text-amber-400 hover:text-amber-300 p-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Photos Grid */}
        {photos.length > 0 && (
          <div className="mb-8">
            <h3 className="font-bold mb-4">{photos.length} fotos selecionadas</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {photos.map((photo) => (
                <div key={photo.id} className="relative aspect-square bg-white/5 rounded-xl overflow-hidden">
                  <NextImage
                    src={photo.preview}
                    alt={`Preview de ${photo.originalFile.name}`}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                    unoptimized
                    className="object-cover"
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

        <div ref={existingPhotosRef} className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold">Fotos ja enviadas ({existingPhotos.length})</h3>
            {isLoadingExisting && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
          </div>

          {existingPhotos.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-sm text-muted-foreground">
              Nenhuma foto enviada ainda para este evento.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {existingPhotos.map((photo) => (
                <div key={photo.id} className="relative aspect-square bg-white/5 rounded-xl overflow-hidden border border-white/10">
                  <NextImage
                    src={photo.previewUrl}
                    alt="Foto enviada"
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                    unoptimized
                    className="object-cover"
                  />
                  <button
                    onClick={() => handleDeleteExistingPhoto(photo.id)}
                    disabled={deletingPhotoId === photo.id}
                    className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-red-500 rounded-full transition-colors disabled:opacity-50"
                    title="Excluir foto"
                  >
                    {deletingPhotoId === photo.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        {photos.length > 0 && !uploadCompletedSuccessfully && (
          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleApplyWatermarks}
              disabled={pendingWithoutWatermark === 0 || isUploading}
              className="flex items-center gap-2 bg-secondary hover:bg-secondary/90 px-6 py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
            >
              <ImageIcon className="h-5 w-5" />
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
        {uploadCompletedSuccessfully && (
          <div className="mt-8 rounded-2xl border border-green-500/20 bg-green-500/10 p-6">
            <p className="text-lg font-semibold text-green-500">
              {doneCount} foto(s) enviada(s) com sucesso!
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Escolha o proximo passo para continuar no mesmo album ou revisar as fotos ja carregadas.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={handleUploadMore}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <Upload className="h-4 w-4" />
                Carregar mais fotos
              </button>
              <button
                onClick={handleViewUploadedPhotos}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 font-medium transition-colors hover:bg-white/10"
              >
                <ImageIcon className="h-4 w-4" />
                Ver fotos carregadas
              </button>
            </div>
          </div>
        )}

        {profile?.role === 'admin' && (
          <div className="mt-6 text-sm text-muted-foreground">
            Como administrador, voce pode gerenciar e excluir fotos deste evento por aqui.
          </div>
        )}
      </div>

      {/* Cover Photo Selection Modal */}
      {showCoverModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-card border border-white/10 rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-2">Escolha a foto de capa</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Selecione uma foto para ser a capa do evento. Se pular, a primeira foto será usada.
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-6">
              {justUploadedPhotos.map((photo) => (
                <button
                  key={photo.id}
                  onClick={() => setSelectedCoverPhotoId(photo.id)}
                  className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-colors ${
                    selectedCoverPhotoId === photo.id
                      ? 'border-primary ring-2 ring-primary/50'
                      : 'border-transparent hover:border-white/20'
                  }`}
                >
                  <NextImage
                    src={photo.previewUrl}
                    alt="Foto candidata a capa"
                    fill
                    sizes="(max-width: 640px) 33vw, 25vw"
                    unoptimized
                    className="object-cover"
                  />
                  {selectedCoverPhotoId === photo.id && (
                    <div className="absolute top-2 right-2 bg-primary rounded-full p-1">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-3 justify-end">
              <button
                onClick={handleSkipCover}
                disabled={savingCover}
                className="px-5 py-2.5 rounded-xl border border-white/10 text-sm font-medium hover:bg-white/5 transition-colors disabled:opacity-50"
              >
                Pular (usar primeira foto)
              </button>
              <button
                onClick={handleConfirmCover}
                disabled={savingCover || !selectedCoverPhotoId}
                className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {savingCover ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Salvando...
                  </span>
                ) : (
                  'Confirmar capa'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
