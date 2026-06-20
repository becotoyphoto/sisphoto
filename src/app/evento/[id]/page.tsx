'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ShoppingCart, ArrowLeft, Loader2, Check, Trash2, Percent, X, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { formatLocalDate, formatPrice } from '@/lib/utils';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';

interface Photo {
  id: string;
  event_id: string;
  storage_path_watermark: string;
  storage_path_original: string;
  price: number;
  metadata: any;
}

export default function EventPage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const photoIdParam = searchParams.get('midia_id');

  const { profile } = useAuth();
  const [event, setEvent] = useState<any>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [photosLoading, setPhotosLoading] = useState(true);
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);
  const { addItem, removeItem, isInCart, items } = useCart();
  const activeThumbnailRef = useRef<HTMLButtonElement>(null);

  // Derived state from URL
  const selectedPhoto = photoIdParam ? photos.find(p => p.id === photoIdParam) || null : null;

  const closeViewer = useCallback(() => {
    router.push(`/evento/${id}`, { scroll: false });
  }, [router, id]);

  const openViewer = useCallback((photo: Photo) => {
    router.push(`/evento/${id}?midia_id=${photo.id}`, { scroll: false });
  }, [router, id]);

  // ── Hooks must be called before any early return ──
  const handleDeletePhoto = useCallback(async (photo: Photo) => {
    if (!window.confirm('Excluir esta foto permanentemente?')) return;

    setDeletingPhotoId(photo.id);
    try {
      const response = await fetch(`/api/photos?id=${photo.id}`, { method: 'DELETE' });
      if (!response.ok) {
        const data = await response.json();
        alert(data.error || 'Erro ao excluir foto.');
        return;
      }

      setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
      setPhotoUrls((prev) => {
        const next = { ...prev };
        delete next[photo.id];
        return next;
      });
    } catch {
      alert('Erro de conexão.');
    } finally {
      setDeletingPhotoId(null);
    }
  }, []);

  // ── Clean up URL if the viewed photo was deleted ──
  useEffect(() => {
    if (photoIdParam && photos.length > 0 && !photos.find((p) => p.id === photoIdParam)) {
      router.replace(`/evento/${id}`, { scroll: false });
    }
  }, [photoIdParam, photos, id, router]);

  // ── Photo navigation ──
  const selectedIndex = selectedPhoto ? photos.findIndex((p) => p.id === selectedPhoto.id) : -1;

  const goToPrev = useCallback(() => {
    if (photos.length === 0) return;
    const newIndex = selectedIndex <= 0 ? photos.length - 1 : selectedIndex - 1;
    openViewer(photos[newIndex]);
  }, [photos, selectedIndex, openViewer]);

  const goToNext = useCallback(() => {
    if (photos.length === 0) return;
    const newIndex = selectedIndex >= photos.length - 1 ? 0 : selectedIndex + 1;
    openViewer(photos[newIndex]);
  }, [photos, selectedIndex, openViewer]);

  useEffect(() => {
    if (!selectedPhoto) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeViewer();
      if (e.key === 'ArrowLeft') goToPrev();
      if (e.key === 'ArrowRight') goToNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPhoto, goToPrev, goToNext, closeViewer]);

  useEffect(() => {
    if (activeThumbnailRef.current) {
      activeThumbnailRef.current.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
  }, [selectedPhoto]);

  useEffect(() => {
    async function loadEventData() {
      if (!id) return;

      setIsLoading(true);
      setPhotosLoading(true);

      const eventRes = await fetch(`/api/event?id=${id}`);
      const eventData = eventRes.ok ? await eventRes.json() : null;
      setEvent(eventData);
      setIsLoading(false);

      if (!eventData) return;

      const photosResponse = await fetch(`/api/photos?eventId=${id}`);
      const photosData = photosResponse.ok
        ? ((await photosResponse.json()) as Photo[])
        : [];

      setPhotos(photosData);
      setPhotosLoading(false);

      if (photosData.length === 0) return;

      const signedRes = await fetch('/api/signed-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: photosData
            .filter((photo) => photo.storage_path_watermark)
            .map((photo) => ({
              id: photo.id,
              path: photo.storage_path_watermark,
              bucket: 'photos',
            })),
        }),
      });

      if (signedRes.ok) {
        const { urls } = await signedRes.json();
        setPhotoUrls(urls || {});
      }
    }

    loadEventData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Evento não encontrado</h1>
        <Link href="/buscar" className="text-primary hover:underline">
          Voltar para busca
        </Link>
      </div>
    );
  }

  const canDeletePhotos =
    profile?.role === 'admin' ||
    (profile?.role === 'photographer' && event?.photographer_id === profile?.id);

  const eventCartItems = items.filter((item: any) => item.event_id === event.id);
  const eventCartCount = eventCartItems.length;

  // Discount tiers
  let discount = 0;
  if (eventCartCount >= 10) discount = 20;
  else if (eventCartCount >= 5) discount = 10;
  else if (eventCartCount >= 2) discount = 5;

  const handleAddToCart = (photo: Photo) => {
    addItem({
      photo_id: photo.id,
      event_id: event.id,
      event_name: event.name,
      image_url: photoUrls[photo.id] || '',
      price: Number(photo.price)
    });
  };

  const handleRemoveFromCart = (photoId: string) => {
    removeItem(photoId);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 mb-8">
        <div>
          <Link href="/buscar" className="flex items-center gap-2 text-primary hover:underline mb-4">
            <ArrowLeft className="h-4 w-4" />
            Voltar para busca
          </Link>
          <h1 className="text-3xl font-bold">{event.name}</h1>
          <p className="text-muted-foreground">
            {formatLocalDate(event.date)} • {event.city}, {event.state}
          </p>
        </div>
        
        {photos.length > 0 && (
          <div className="flex items-center gap-4 bg-primary/10 border border-primary/20 p-4 rounded-2xl">
            <p className="text-sm">
              Preço por foto: <span className="font-bold text-primary">{formatPrice(Number(photos[0].price))}</span>
            </p>
          </div>
        )}
      </div>

      {/* Discount Banner */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row gap-2 h-auto md:h-24 lg:h-28">
          {/* Left Side - Info */}
          <div className="flex-1 bg-[#f4f9ff] rounded-xl p-3 md:p-4 flex items-center relative overflow-hidden text-[#2b7cf6]">
            {/* Decorative Icon */}
            <div className="hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 opacity-10">
              <Percent className="w-32 h-32" />
            </div>
            
            <div className="flex-1 text-center relative z-10">
              <h2 className="text-lg md:text-xl lg:text-2xl font-black text-[#2b7cf6] mb-1 uppercase leading-tight">
                GANHE ATÉ<br className="hidden md:block"/> 20% DE DESCONTO!
              </h2>
              <p className="text-[10px] md:text-xs font-medium text-[#6faaf8]">
                Os descontos são aplicados automaticamente.
              </p>
              <p className="text-[9px] md:text-[10px] text-[#9bc4fa] mt-0.5">
                (Válido somente neste álbum)
              </p>
            </div>
          </div>

          {/* Right Side - Tiers */}
          <div className="flex gap-2 w-full md:w-[50%] lg:w-[45%] h-20 md:h-auto">
            {/* 5% */}
            <div className={`flex-1 rounded-xl p-2 flex flex-col items-center justify-center text-center bg-[#f4f9ff] text-[#2b7cf6] transition-all ${eventCartCount >= 2 && eventCartCount < 5 ? 'ring-2 ring-[#2b7cf6] scale-105 shadow-md z-10' : ''}`}>
              <p className="text-[8px] md:text-[10px] font-bold uppercase tracking-wider mb-0.5">GANHE</p>
              <p className="text-2xl md:text-3xl lg:text-4xl font-black leading-none mb-0.5">5<span className="text-sm md:text-lg">%</span></p>
              <p className="text-[8px] md:text-[9px] font-medium leading-tight">Na compra<br/>de 2 fotos</p>
            </div>
            
            {/* 10% */}
            <div className={`flex-1 rounded-xl p-2 flex flex-col items-center justify-center text-center bg-[#d0e6ff] text-[#2b7cf6] transition-all ${eventCartCount >= 5 && eventCartCount < 10 ? 'ring-2 ring-[#2b7cf6] scale-105 shadow-md z-10' : ''}`}>
              <p className="text-[8px] md:text-[10px] font-bold uppercase tracking-wider mb-0.5">GANHE</p>
              <p className="text-2xl md:text-3xl lg:text-4xl font-black leading-none mb-0.5">10<span className="text-sm md:text-lg">%</span></p>
              <p className="text-[8px] md:text-[9px] font-medium leading-tight">Na compra<br/>de 5 fotos</p>
            </div>

            {/* 20% */}
            <div className={`flex-1 rounded-xl p-2 flex flex-col items-center justify-center text-center bg-[#6daaf8] text-white transition-all ${eventCartCount >= 10 ? 'ring-2 ring-[#2b7cf6] scale-105 shadow-md z-10' : ''}`}>
              <p className="text-[8px] md:text-[10px] font-bold uppercase tracking-wider mb-0.5">GANHE</p>
              <p className="text-2xl md:text-3xl lg:text-4xl font-black leading-none mb-0.5">20<span className="text-sm md:text-lg">%</span></p>
              <p className="text-[8px] md:text-[9px] font-medium leading-tight">Na compra<br/>de 10 fotos</p>
            </div>
          </div>
        </div>

        {eventCartCount > 0 && (
          <div className="mt-4 text-center">
            <p className="text-sm">
              <span className="font-bold text-primary">{eventCartCount} foto{eventCartCount > 1 ? 's' : ''}</span> no carrinho
              {discount > 0 && (
                <span className="ml-1">
                  — <span className="font-bold text-green-400">{discount}% de desconto aplicado!</span>
                </span>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Gallery Grid */}
      {photosLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1.5">
        {photos.map((photo) => {
          const inCart = isInCart(photo.id);
          return (
            <div key={photo.id} className="group relative aspect-square bg-white/5 overflow-hidden cursor-pointer" onClick={() => openViewer(photo)}>
              {/* Main Image - click to open preview */}
              {photoUrls[photo.id] ? (
                <img 
                  src={photoUrls[photo.id]} 
                  alt="Foto do evento"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div 
                  className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20"
                />
              )}
              
              {/* Hover overlay with actions */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2 pointer-events-none group-hover:pointer-events-auto">
                <div className="flex items-center justify-between gap-1">
                  <p className="text-xs font-bold truncate">R$ {Number(photo.price).toFixed(2)}</p>
                  
                  <div className="flex items-center gap-1">
                    {inCart ? (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleRemoveFromCart(photo.id); }}
                        className="bg-red-500 hover:bg-red-600 p-1.5 rounded-full transition-colors"
                        title="Remover"
                      >
                        <Check className="h-3 w-3" />
                      </button>
                    ) : (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleAddToCart(photo); }}
                        className="bg-primary hover:bg-primary/90 p-1.5 rounded-full transition-colors"
                        title="Adicionar ao carrinho"
                      >
                        <ShoppingCart className="h-3 w-3" />
                      </button>
                    )}

                    {canDeletePhotos && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeletePhoto(photo); }}
                        disabled={deletingPhotoId === photo.id}
                        className="p-1.5 bg-red-500/30 hover:bg-red-500/50 rounded-full transition-colors disabled:opacity-50"
                        title="Excluir foto"
                      >
                        {deletingPhotoId === photo.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3 text-red-300" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      )}

      {!photosLoading && photos.length === 0 && (
        <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10">
          <p className="text-muted-foreground">Nenhuma foto disponível para este evento.</p>
        </div>
      )}

      {/* Floating Cart Button (Mobile) */}
      {items.length > 0 && (
        <div className="fixed bottom-8 right-8 md:hidden">
          <Link 
            href="/carrinho"
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 p-4 rounded-full shadow-lg shadow-primary/20 transition-all"
          >
            <ShoppingCart className="h-6 w-6" />
            <span className="font-bold">{items.length} foto{items.length > 1 ? 's' : ''}</span>
          </Link>
        </div>
      )}

      {/* Fullscreen Photo Viewer */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 to-transparent">
            <span className="text-sm text-white/70">
               {selectedIndex + 1} / {photos.length}
             </span>
             <button
               onClick={closeViewer}
               className="p-2 hover:bg-white/10 rounded-full transition-colors"
             >
               <X className="h-6 w-6 text-white" />
             </button>
           </div>

          {/* Navigation arrows */}
          {photos.length > 1 && (
            <>
              <button
                onClick={goToPrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <ChevronLeft className="h-8 w-8 text-white" />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <ChevronRight className="h-8 w-8 text-white" />
              </button>
            </>
          )}

          {/* Photo */}
          <div className="flex-1 flex items-center justify-center p-4 md:p-8 pb-32 md:pb-40">
            {photoUrls[selectedPhoto.id] ? (
              <img
                src={photoUrls[selectedPhoto.id]}
                alt="Foto do evento"
                className="max-h-full max-w-full object-contain select-none"
                draggable={false}
              />
            ) : (
              <Loader2 className="h-12 w-12 animate-spin text-white/50" />
            )}
          </div>

          {/* Bottom Area: Carousel + Actions */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/90 to-transparent flex flex-col">
            
            {/* Thumbnail Carousel */}
            <div className="w-full overflow-x-auto flex items-center gap-2 px-4 py-2 scrollbar-hide snap-x">
              {photos.map((photo) => {
                const isActive = selectedPhoto.id === photo.id;
                return (
                  <button
                    key={photo.id}
                    ref={isActive ? activeThumbnailRef : null}
                    onClick={() => openViewer(photo)}
                    className={`relative flex-shrink-0 h-16 w-16 md:h-20 md:w-20 rounded-md overflow-hidden snap-center transition-all ${
                      isActive ? 'ring-2 ring-primary opacity-100 scale-105' : 'opacity-50 hover:opacity-100'
                    }`}
                  >
                    {photoUrls[photo.id] ? (
                      <img
                        src={photoUrls[photo.id]}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-white/10" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Price & Actions */}
            <div className="w-full px-4 py-3 md:py-4">
              <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
                <p className="text-xl md:text-2xl font-bold text-white">R$ {Number(selectedPhoto.price).toFixed(2)}</p>
                <div className="flex items-center gap-2">
                  {canDeletePhotos && (
                    <button
                      onClick={() => handleDeletePhoto(selectedPhoto)}
                      disabled={deletingPhotoId === selectedPhoto.id}
                      className="p-2.5 md:p-3 bg-red-500/20 hover:bg-red-500/40 rounded-full transition-colors disabled:opacity-50"
                      title="Excluir foto"
                    >
                      {deletingPhotoId === selectedPhoto.id ? (
                        <Loader2 className="h-5 w-5 md:h-6 md:w-6 animate-spin" />
                      ) : (
                        <Trash2 className="h-5 w-5 md:h-6 md:w-6 text-red-300" />
                      )}
                    </button>
                  )}
                  {isInCart(selectedPhoto.id) ? (
                    <button
                      onClick={() => handleRemoveFromCart(selectedPhoto.id)}
                      className="bg-red-500 hover:bg-red-600 px-6 py-3 md:py-3.5 rounded-full font-bold transition-colors text-sm md:text-base"
                    >
                      <Check className="h-5 w-5 md:h-6 md:w-6 inline mr-2" />
                      Remover
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        handleAddToCart(selectedPhoto);
                      }}
                      className="bg-primary hover:bg-primary/90 px-6 py-3 md:py-3.5 rounded-full font-bold transition-colors text-sm md:text-base"
                    >
                      <ShoppingCart className="h-5 w-5 md:h-6 md:w-6 inline mr-2" />
                      Adicionar
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
