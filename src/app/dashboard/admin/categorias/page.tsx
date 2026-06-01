'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Edit, Trash2, Loader2, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { getCategories, Category } from '@/lib/database';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const data = await getCategories();
    setCategories(data);
    setIsLoading(false);
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    
    setIsAdding(true);
    try {
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategory, slug: newCategory.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') }),
      });

      if (response.ok) {
        setNewCategory('');
        loadCategories();
      }
    } catch (err) {
      console.error('Error adding category:', err);
    } finally {
      setIsAdding(false);
    }
  };

  const handleUpdateCategory = async (id: string) => {
    if (!editingName.trim()) return;
    
    try {
      const response = await fetch('/api/admin/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name: editingName }),
      });

      if (response.ok) {
        setEditingId(null);
        setEditingName('');
        loadCategories();
      }
    } catch (err) {
      console.error('Error updating category:', err);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) return;
    
    try {
      const response = await fetch('/api/admin/categories', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (response.ok) {
        loadCategories();
      }
    } catch (err) {
      console.error('Error deleting category:', err);
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
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link 
        href="/dashboard/admin"
        className="inline-flex items-center gap-2 text-primary hover:underline mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para dashboard
      </Link>

      <h1 className="text-3xl font-bold mb-8">Gerenciar Categorias</h1>

      {/* Add New Category */}
      <div className="bg-card border border-white/10 rounded-2xl p-6 mb-8">
        <h2 className="font-bold mb-4">Adicionar Nova Categoria</h2>
        <div className="flex gap-4">
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="Nome da categoria"
            className="flex-1 bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary focus:outline-none"
            onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
          />
          <button
            onClick={handleAddCategory}
            disabled={isAdding || !newCategory.trim()}
            className="bg-primary hover:bg-primary/90 px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            {isAdding ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Plus className="h-5 w-5" />
                Adicionar
              </>
            )}
          </button>
        </div>
      </div>

      {/* Categories List */}
      <div className="bg-card border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <h2 className="font-bold">Categorias ({categories.length})</h2>
        </div>
        
        {categories.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            Nenhuma categoria cadastrada.
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {categories.map((category) => (
              <div key={category.id} className="p-4 flex items-center justify-between">
                {editingId === category.id ? (
                  <div className="flex-1 flex gap-3">
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg py-2 px-3 focus:ring-2 focus:ring-primary focus:outline-none"
                      autoFocus
                      onKeyPress={(e) => e.key === 'Enter' && handleUpdateCategory(category.id)}
                    />
                    <button
                      onClick={() => handleUpdateCategory(category.id)}
                      className="p-2 bg-green-500/20 hover:bg-green-500/30 text-green-500 rounded-lg transition-colors"
                    >
                      <CheckCircle className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => { setEditingId(null); setEditingName(''); }}
                      className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-4">
                      <span className="font-medium">{category.name}</span>
                      <span className="text-xs text-muted-foreground">/{category.slug}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setEditingId(category.id); setEditingName(category.name); }}
                        className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                      >
                        <Edit className="h-5 w-5 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category.id)}
                        className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-5 w-5 text-red-500" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
