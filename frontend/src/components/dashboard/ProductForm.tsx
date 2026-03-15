'use client';

import React, { useState, useEffect, useRef } from 'react';
import type { Product, CreateProductDto } from '@/types';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardBody } from '../ui/Card';
import { compressImage, validateImageFile, formatFileSize } from '@/utils/imageCompression';
import { uploadService } from '@/services/upload.service';

interface ProductFormProps {
  product?: Product | null;
  onSubmit: (data: CreateProductDto) => Promise<void>;
  onCancel: () => void;
}

const STANDARD_CATEGORIES = ['tshirt', 'hoodie', 'jacket', 'pants', 'shoes', 'accessories'];
const CATEGORY_LABELS: Record<string, string> = {
  tshirt: 'Camiseta', hoodie: 'Hoodie', jacket: 'Chaqueta',
  pants: 'Pantalones', shoes: 'Zapatos', accessories: 'Accesorios', other: 'Otros',
};

const N8N_DESCRIPTOR_URL = process.env.NEXT_PUBLIC_N8N_DESCRIPTOR_URL || '';

export function ProductForm({ product, onSubmit, onCancel }: ProductFormProps) {
  const [formData, setFormData] = useState<CreateProductDto>({ name: '', description: '', imageUrl: '', category: 'tshirt' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [compressionInfo, setCompressionInfo] = useState<string | null>(null);
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [describingWithAI, setDescribingWithAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canDescribeWithAI = !!formData.imageUrl && !!formData.name.trim() && !!N8N_DESCRIPTOR_URL;

  const handleDescribeWithAI = async () => {
    if (!canDescribeWithAI) return;
    setDescribingWithAI(true);
    setAiError(null);
    try {
      const res = await fetch(N8N_DESCRIPTOR_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: formData.imageUrl,
          product_name: formData.name.trim(),
          category: formData.category === 'other' ? customCategory : formData.category,
        }),
      });
      if (!res.ok) throw new Error('Error al conectar con el servicio de IA');
      const raw = await res.text();
      if (!raw || !raw.trim()) throw new Error('El servicio de IA no devolvió respuesta');
      let description = '';
      try {
        const data = JSON.parse(raw);
        description = data.description || data.text || '';
      } catch {
        // Si no es JSON válido, usar el texto directamente
        description = raw.trim();
      }
      if (!description) throw new Error('La IA no devolvió una descripción');
      // Limpiar markdown: quitar **, *, ##, # y normalizar saltos de línea
      const clean = description
        .replace(/#{1,6}\s*/g, '')
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/\*(.+?)\*/g, '$1')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
      setFormData(p => ({ ...p, description: clean }));
    } catch (err: any) {
      setAiError(err.message || 'Error al generar descripción');
    } finally {
      setDescribingWithAI(false);
    }
  };

  useEffect(() => {
    if (product) {
      const isCustom = !STANDARD_CATEGORIES.includes(product.category);
      setFormData({ name: product.name, description: product.description || '', imageUrl: product.imageUrl, category: isCustom ? 'other' : product.category });
      setImagePreview(product.imageUrl);
      if (isCustom) { setShowCustomCategory(true); setCustomCategory(product.category); }
    }
  }, [product]);

  const handleImageFile = async (file: File) => {
    setErrors(p => ({ ...p, imageUrl: '' }));
    setCompressionInfo(null);
    const validation = validateImageFile(file);
    if (!validation.valid) { setErrors(p => ({ ...p, imageUrl: validation.error || 'Archivo inválido' })); return; }
    try {
      setCompressing(true);
      const originalSize = file.size;
      const compressed = await compressImage(file, { maxWidth: 1920, maxHeight: 1920, quality: 0.85, maxSizeMB: 5 });
      const saved = Math.round(((originalSize - compressed.size) / originalSize) * 100);
      if (saved > 10) setCompressionInfo(`Optimizada: ${formatFileSize(originalSize)} → ${formatFileSize(compressed.size)} (${saved}% reducido)`);
      const base64 = await new Promise<string>((res, rej) => {
        const r = new FileReader();
        r.onload = e => res(e.target?.result as string);
        r.onerror = rej;
        r.readAsDataURL(compressed);
      });
      const ts = new Date().toISOString().replace(/[:.]/g, '-');
      const url = await uploadService.uploadImage(base64.split(',')[1], `product-${ts}.jpg`, false);
      setImagePreview(url);
      setFormData(p => ({ ...p, imageUrl: url }));
    } catch (err: any) {
      setErrors(p => ({ ...p, imageUrl: err.message || 'Error al procesar la imagen' }));
    } finally { setCompressing(false); }
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!formData.name.trim()) e.name = 'El nombre es requerido';
    if (!formData.imageUrl.trim()) e.imageUrl = 'La imagen es requerida';
    else { try { new URL(formData.imageUrl); } catch { e.imageUrl = 'Debe ser una URL válida'; } }
    if (!formData.category) e.category = 'La categoría es requerida';
    if (formData.category === 'other' && !customCategory.trim()) e.customCategory = 'Especifica la categoría';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await onSubmit({ ...formData, category: formData.category === 'other' ? customCategory.trim() : formData.category });
    } catch { /* error manejado por el padre */ } finally { setIsSubmitting(false); }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'category') { setShowCustomCategory(value === 'other'); if (value !== 'other') setCustomCategory(''); }
    setFormData(p => ({ ...p, [name]: value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }));
  };

  const selectStyle = {
    backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)',
    color: 'var(--text-primary)', borderRadius: '0.5rem', padding: '0.5rem 0.75rem',
    fontSize: '0.875rem', width: '100%', outline: 'none', border: '1px solid var(--border-color)',
  };

  const textareaStyle = {
    backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)',
    color: 'var(--text-primary)', borderRadius: '0.5rem', padding: '0.5rem 0.75rem',
    fontSize: '0.875rem', width: '100%', outline: 'none', border: '1px solid var(--border-color)',
    resize: 'vertical' as const,
  };

  return (
    <Card>
      <CardHeader>
        <h3 className="font-syne font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
          {product ? 'Editar Producto' : 'Nuevo Producto'}
        </h3>
      </CardHeader>
      <CardBody>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nombre" name="name" value={formData.name} onChange={handleChange} error={errors.name} placeholder="Ej: Camiseta Logo" required />

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Descripción</label>
              {N8N_DESCRIPTOR_URL && (
                <button
                  type="button"
                  onClick={handleDescribeWithAI}
                  disabled={!canDescribeWithAI || describingWithAI}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: 'rgba(255,92,58,0.1)', color: '#FF5C3A', border: '1px solid rgba(255,92,58,0.25)' }}
                  title={!formData.imageUrl || !formData.name.trim() ? 'Agrega nombre e imagen primero' : 'Generar descripción con IA'}
                >
                  {describingWithAI ? (
                    <>
                      <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Analizando...
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      Describir con IA
                    </>
                  )}
                </button>
              )}
            </div>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              style={textareaStyle}
              placeholder="Descripción del producto (opcional, o genera una con IA)"
            />
            {aiError && (
              <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" />
                </svg>
                {aiError}
              </p>
            )}
            {!canDescribeWithAI && N8N_DESCRIPTOR_URL && (
              <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                Agrega nombre e imagen para habilitar la descripción con IA
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Imagen del Producto</label>
            <div className="space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={compressing} size="sm">
                  {compressing ? 'Procesando...' : 'Subir imagen'}
                </Button>
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>o ingresa una URL</span>
              </div>
              <Input name="imageUrl" value={formData.imageUrl} onChange={handleChange} error={errors.imageUrl} placeholder="https://ejemplo.com/imagen.jpg" required />
              <input ref={fileInputRef} type="file" className="hidden" accept="image/jpeg,image/png,image/webp" onChange={e => e.target.files?.[0] && handleImageFile(e.target.files[0])} />
              {compressionInfo && <p className="text-xs" style={{ color: '#10b981' }}>{compressionInfo}</p>}
              {imagePreview && (
                <div>
                  <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>Vista previa:</p>
                  <img src={imagePreview} alt="Preview" className="w-full max-w-[200px] object-cover rounded-lg border" style={{ borderColor: 'var(--border-color)' }} />
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Categoría</label>
            <select name="category" value={formData.category} onChange={handleChange} style={selectStyle} required>
              {[...STANDARD_CATEGORIES, 'other'].map(c => (
                <option key={c} value={c}>{CATEGORY_LABELS[c] ?? c}</option>
              ))}
            </select>
            {errors.category && <p className="mt-1 text-xs text-red-500">{errors.category}</p>}
            {showCustomCategory && (
              <div className="mt-3">
                <Input label="Especificar categoría" name="customCategory" value={customCategory}
                  onChange={e => { setCustomCategory(e.target.value); if (errors.customCategory) setErrors(p => ({ ...p, customCategory: '' })); }}
                  error={errors.customCategory} placeholder="Ej: Gorras, Bufandas..." required />
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? 'Guardando...' : product ? 'Actualizar' : 'Crear'}
            </Button>
            <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting} className="flex-1">
              Cancelar
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
