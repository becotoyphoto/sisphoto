'use client';

import { useState, useEffect, useRef } from 'react';
import { Camera, MapPin, Calendar, Loader2, ArrowLeft, Save, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';

interface Category {
  id: string;
  name: string;
}

interface UploadedPhoto {
  id: string;
  url: string;
  publicUrl: string;
  storagePath: string;
  name: string;
}

const brazilianStates = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const selectClassName =
  'w-full bg-slate-950 text-white border border-white/10 rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary focus:outline-none';

export default function EditEventPage() {
  const router = useRouter();
  const { id } = useParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [uploadedPhotos, setUploadedPhotos] = useState<UploadedPhoto[]>([]);
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);
  const photoPickerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    city: '',
    state: 'SP',
    date: '',
    cover_image_url: '',
    status: 'draft',
    price: '15.00',
  });

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      try {
        const [catRes, evtRes] = await Promise.all([
          fetch('/api/categories'),
          fetch(`/api/events/${id}`),
        ]);

        const cats = await catRes.json();
        if (Array.isArray(cats)) setCategories(cats);

        if (evtRes.ok) {
          const evt = await evtRes.json();
          const firstPhotoPrice = evt.photos?.[0]?.price;
          setFormData({
            name: evt.name || '',
            description: evt.description || '',
            category_id: evt.category?.id || '',
            city: evt.city || '',
            state: evt.state || 'SP',
            date: evt.date || '',
            cover_image_url: evt.cover_image_url || '',
            status: evt.status || 'draft',
            price: firstPhotoPrice ? String(firstPhotoPrice) : '15.00',
          });

          // Load uploaded photos for cover picker
          const photosRes = await fetch(`/api/photos?eventId=${id}`);
          if (photosRes.ok) {
            const photosData = await photosRes.json();
            if (Array.isArray(photosData) && photosData.length > 0) {
              const signedRes = await fetch('/api/signed-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  items: photosData
                    .filter((p: any) => p.storage_path_watermark)
                    .map((p: any) => ({
                      id: p.id,
                      path: p.storage_path_watermark,
                      bucket: 'photos',
                    })),
                }),
              });
              if (signedRes.ok) {
                const { urls } = await signedRes.json();
                const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
                const photos: UploadedPhoto[] = photosData
                  .filter((p: any) => urls[p.id])
                  .map((p: any) => ({
                    id: p.id,
                    url: urls[p.id],
                    publicUrl: `${supabaseUrl}/storage/v1/object/public/photos/${p.storage_path_watermark}`,
                    storagePath: p.storage_path_watermark,
                    name: p.storage_path_watermark.split('/').pop() || 'Foto',
                  }));
                setUploadedPhotos(photos);
              }
            }
          }
        }
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Erro ao carregar dados do evento.');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [id]);

  // Close photo picker on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (photoPickerRef.current && !photoPickerRef.current.contains(e.target as Node)) {
        setShowPhotoPicker(false);
      }
    }
    if (showPhotoPicker) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showPhotoPicker]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao atualizar evento');
      }

      setSuccess('Evento atualizado com sucesso!');
      setTimeout(() => router.push('/dashboard/fotografo'), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar evento');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
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
            <Camera className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Editar Evento</h1>
            <p className="text-muted-foreground">Altere os dados do evento</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-500">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Nome do Evento *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Descrição</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary focus:outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Categoria</label>
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                className={selectClassName}
              >
                <option value="" className="bg-slate-950 text-white">Selecione uma categoria</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id} className="bg-slate-950 text-white">{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Data do Evento *</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-2">Cidade *</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Estado *</label>
              <select
                name="state"
                value={formData.state}
                onChange={handleChange}
                required
                className={selectClassName}
              >
                {brazilianStates.map((state) => (
                  <option key={state} value={state} className="bg-slate-950 text-white">{state}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Cover Image Picker */}
          <div>
            <label className="block text-sm font-medium mb-2">Imagem de Capa</label>
            <div className="flex gap-2">
              <input
                type="url"
                name="cover_image_url"
                value={formData.cover_image_url}
                onChange={handleChange}
                placeholder="https://..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary focus:outline-none"
              />
              {uploadedPhotos.length > 0 && (
                <div className="relative" ref={photoPickerRef}>
                  <button
                    type="button"
                    onClick={() => setShowPhotoPicker(!showPhotoPicker)}
                    className="flex items-center gap-2 bg-slate-950 text-white border border-white/10 rounded-xl py-3 px-4 hover:border-primary transition-colors whitespace-nowrap"
                  >
                    <Camera className="h-4 w-4" />
                    Escolher
                  </button>
                  {showPhotoPicker && (
                    <div className="absolute right-0 top-full mt-1 w-80 max-h-72 overflow-y-auto bg-slate-950 border border-white/10 rounded-xl shadow-2xl z-50">
                      <div className="p-2 border-b border-white/10">
                        <p className="text-xs text-muted-foreground px-2">Clique para selecionar como capa</p>
                      </div>
                      {uploadedPhotos.map((photo) => (
                        <button
                          key={photo.id}
                          type="button"
                          className={`w-full flex items-center gap-3 px-3 py-2 hover:bg-white/10 transition-colors text-left ${
                            formData.cover_image_url === photo.publicUrl ? 'bg-primary/10 ring-1 ring-primary' : ''
                          }`}
                          onClick={() => {
                            setFormData(prev => ({ ...prev, cover_image_url: photo.publicUrl }));
                            setShowPhotoPicker(false);
                          }}
                        >
                          <img src={photo.url} alt="" className="w-12 h-12 object-cover rounded-lg flex-shrink-0" />
                          <span className="text-sm truncate">{photo.name}</span>
                          {formData.cover_image_url === photo.publicUrl && (
                            <span className="ml-auto text-xs text-primary font-bold">CAPA</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            {formData.cover_image_url && (
              <div className="mt-3 relative inline-block">
                <img
                  src={formData.cover_image_url}
                  alt="Preview capa"
                  className="h-28 rounded-xl object-cover border border-white/10"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, cover_image_url: '' }))}
                  className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 hover:bg-red-600 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className={selectClassName}
            >
              <option value="draft" className="bg-slate-950 text-white">Rascunho</option>
              <option value="published" className="bg-slate-950 text-white">Publicado</option>
            </select>
            <p className="text-xs text-muted-foreground mt-1">
              Eventos em rascunho não são visíveis ao público.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Preço por foto (R$)</label>
            <input
              type="number"
              name="price"
              step="0.01"
              min="0.01"
              value={formData.price}
              onChange={handleChange}
              className="w-full md:w-48 bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary focus:outline-none"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Altera o preço de todas as fotos do evento. Pedidos já concluídos não são afetados.
            </p>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 py-3 rounded-xl border border-white/10 hover:bg-white/5 font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-3 rounded-xl bg-primary hover:bg-primary/90 font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  Salvar Alterações
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
