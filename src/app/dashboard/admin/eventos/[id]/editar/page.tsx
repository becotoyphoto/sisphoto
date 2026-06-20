'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Camera, Loader2, Save, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';

interface Category {
  id: string;
  name: string;
}

interface UploadedPhoto {
  id: string;
  url: string;
  name: string;
}

const brazilianStates = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const STATUS_CONFIG: Record<string, { label: string }> = {
  draft: { label: 'Rascunho' },
  published: { label: 'Publicado' },
  archived: { label: 'Arquivado' },
};

const selectClassName =
  'w-full bg-slate-950 text-white border border-white/10 rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary focus:outline-none';

export default function AdminEditEventPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const photoPickerRef = useRef<HTMLDivElement>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [uploadedPhotos, setUploadedPhotos] = useState<UploadedPhoto[]>([]);
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    city: '',
    state: 'RJ',
    date: '',
    cover_image_url: '',
    status: 'draft',
  });

  useEffect(() => {
    async function load() {
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
          setFormData({
            name: evt.name || '',
            description: evt.description || '',
            category_id: evt.category?.id || '',
            city: evt.city || '',
            state: evt.state || 'RJ',
            date: evt.date || '',
            cover_image_url: evt.cover_image_url || '',
            status: evt.status || 'draft',
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
                const photos: UploadedPhoto[] = photosData
                  .filter((p: any) => urls[p.id])
                  .map((p: any) => ({
                    id: p.id,
                    url: urls[p.id],
                    name: p.storage_path_watermark.split('/').pop() || 'Foto',
                  }));
                setUploadedPhotos(photos);
              }
            }
          }
        }
      } catch {
        setError('Erro ao carregar dados.');
      } finally {
        setIsLoading(false);
      }
    }
    load();
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
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    setError(null);

    if (!formData.name || !formData.city || !formData.state || !formData.date) {
      setError('Preencha todos os campos obrigatórios.');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Erro ao salvar.');
        return;
      }

      router.push(`/dashboard/admin/eventos/${id}`);
    } catch {
      setError('Erro de conexão.');
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
        href={`/dashboard/admin/eventos/${id}`}
        className="inline-flex items-center gap-2 text-primary hover:underline mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para detalhes
      </Link>

      <div className="bg-card border border-white/10 rounded-2xl p-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-primary/10 rounded-xl">
            <Camera className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Editar Evento</h1>
            <p className="text-muted-foreground text-sm">Evento ID: {id}</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Nome do Evento *</label>
            <input
              type="text" name="name" value={formData.name} onChange={handleChange} required
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Categoria</label>
              <select name="category_id" value={formData.category_id} onChange={handleChange} className={selectClassName}>
                <option value="" className="bg-slate-950 text-white">Selecione</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id} className="bg-slate-950 text-white">{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Data *</label>
              <input type="date" name="date" value={formData.date} onChange={handleChange} required
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Cidade *</label>
              <input type="text" name="city" value={formData.city} onChange={handleChange} required
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Estado *</label>
              <select name="state" value={formData.state} onChange={handleChange} required className={selectClassName}>
                {brazilianStates.map((s) => (
                  <option key={s} value={s} className="bg-slate-950 text-white">{s}</option>
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
                            formData.cover_image_url === photo.url ? 'bg-primary/10 ring-1 ring-primary' : ''
                          }`}
                          onClick={() => {
                            setFormData(prev => ({ ...prev, cover_image_url: photo.url }));
                            setShowPhotoPicker(false);
                          }}
                        >
                          <img src={photo.url} alt="" className="w-12 h-12 object-cover rounded-lg flex-shrink-0" />
                          <span className="text-sm truncate">{photo.name}</span>
                          {formData.cover_image_url === photo.url && (
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
            <select name="status" value={formData.status} onChange={handleChange} className={selectClassName}>
              {Object.entries(STATUS_CONFIG).map(([value, cfg]) => (
                <option key={value} value={value} className="bg-slate-950 text-white">{cfg.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Descrição</label>
            <textarea name="description" value={formData.description} onChange={handleChange} rows={4}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary focus:outline-none resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Link href={`/dashboard/admin/eventos/${id}`}
              className="flex-1 flex items-center justify-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 px-6 py-3 rounded-xl font-bold transition-colors text-center"
            >
              Cancelar
            </Link>
            <button onClick={handleSubmit} disabled={isSaving}
              className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 px-6 py-3 rounded-xl font-bold transition-colors disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
              Salvar Alterações
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
