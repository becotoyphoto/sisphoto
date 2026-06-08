'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart, ArrowLeft, ZoomIn, Info, Loader2, Check, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getEventById, getPhotoUrl, Event, Photo } from '@/lib/database';
import { formatLocalDate, formatPrice } from '@/lib/utils';
import { useCart } from '@/contexts/CartContext';

export default function EventPage() {
  const { id } = useParams();
  const [event, setEvent] = useState<Event | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const { addItem, removeItem, isInCart, items } = useCart();

  useEffect(() => {
    async function loadEventData() {
      if (!id) return;
      
      setIsLoading(true);
      const [eventData, photosResponse] = await Promise.all([
        getEventById(id as string),
        fetch(`/api/photos?eventId=${id}`)
      ]);
      const photosData = photosResponse.ok
        ? ((await photosResponse.json()) as Photo[])
        : [];
      
      setEvent(eventData);
      setPhotos(photosData);

      const urls: Record<string, string> = {};
      for (const photo of photosData) {
        urls[photo.id] = await getPhotoUrl(photo.storage_path_watermark);
      }
      setPhotoUrls(urls);
      setIsLoading(false);
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
            <Info className="h-5 w-5 text-primary" />
            <p className="text-sm">
              Preço por foto: <span className="font-bold text-primary">{formatPrice(Number(photos[0].price))}</span>
            </p>
          </div>
        )}
      </div>

      {/* Gallery Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos.map((photo) => {
          const inCart = isInCart(photo.id);
          return (
            <div key={photo.id} className="group relative aspect-square bg-white/5 rounded-xl overflow-hidden border border-white/10">
              {/* Main Image */}
              {photoUrls[photo.id] ? (
                <img 
                  src={photoUrls[photo.id]} 
                  alt="Foto do evento"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20" />
              )}
              
              {/* Watermark Overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30 rotate-45">
                <span className="text-lg font-black tracking-widest text-white/50 border-2 border-white/50 p-1 uppercase">
                  SisPhoto
                </span>
              </div>

              {/* Hover Actions */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 p-4 text-center">
                <p className="text-sm font-bold">R$ {Number(photo.price).toFixed(2)}</p>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setSelectedPhoto(photo)}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                  >
                    <ZoomIn className="h-5 w-5" />
                  </button>
                  
                  {inCart ? (
                    <button 
                      onClick={() => handleRemoveFromCart(photo.id)}
                      className="flex items-center gap-2 bg-red-500 hover:bg-red-600 px-4 py-2 rounded-full text-xs font-bold transition-colors"
                    >
                      <Check className="h-4 w-4" />
                      Adicionado
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleAddToCart(photo)}
                      className="flex items-center gap-2 bg-primary hover:bg-primary/90 px-4 py-2 rounded-full text-xs font-bold transition-colors"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      Adicionar
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {photos.length === 0 && (
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

      {/* Modal for Photo Preview */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setSelectedPhoto(null)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300"
            >
              Fechar
            </button>
            {photoUrls[selectedPhoto.id] && (
              <img 
                src={photoUrls[selectedPhoto.id]} 
                alt="Foto em tamanho grande"
                className="w-full h-auto rounded-lg"
              />
            )}
            <div className="mt-4 flex items-center justify-between">
              <p className="text-white font-bold text-xl">R$ {Number(selectedPhoto.price).toFixed(2)}</p>
              {isInCart(selectedPhoto.id) ? (
                <button 
                  onClick={() => handleRemoveFromCart(selectedPhoto.id)}
                  className="flex items-center gap-2 bg-red-500 hover:bg-red-600 px-6 py-3 rounded-full font-bold transition-colors"
                >
                  <Check className="h-5 w-5" />
                  Adicionado ao carrinho
                </button>
              ) : (
                <button 
                  onClick={() => {
                    handleAddToCart(selectedPhoto);
                    setSelectedPhoto(null);
                  }}
                  className="flex items-center gap-2 bg-primary hover:bg-primary/90 px-6 py-3 rounded-full font-bold transition-colors"
                >
                  <ShoppingCart className="h-5 w-5" />
                  Adicionar ao carrinho
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
