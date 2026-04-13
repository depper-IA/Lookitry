'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import type { Product, CreateProductDto, AttributeDefinition, CategoryAttribute } from '@/types';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardBody } from '../ui/Card';
import { compressImage, validateImageFile, formatFileSize } from '@/utils/imageCompression';
import { uploadService } from '@/services/upload.service';
import { categoryAttributesService } from '@/services/products.service';

interface ProductFormProps {
  product?: Product | null;
  showExternalId?: boolean;
  onSubmit: (data: CreateProductDto) => Promise<void>;
  onCancel: () => void;
}

const STANDARD_CATEGORIES = ['tshirt', 'hoodie', 'jacket', 'pants', 'shoes', 'accessories', 'vestido', 'rines', 'zapatos', 'camisa'];
const CATEGORY_LABELS: Record<string, string> = {
  tshirt: 'Camiseta', hoodie: 'Hoodie', jacket: 'Chaqueta', pants: 'Pantalones',
  shoes: 'Zapatos', accessories: 'Accesorios', vestido: 'Vestido', rines: 'Rines',
  zapatos: 'Zapatos', camisa: 'Camisa', other: 'Otros',
};

const AI_CATEGORY_MAP: Record<string, string> = {
  CAMISA: 'tshirt', SHIRT: 'tshirt', TSHIRT: 'tshirt', BLUSA: 'tshirt',
  PANTALON: 'pants', PANTS: 'pants', JEANS: 'pants', FALDA: 'pants',
  ZAPATOS: 'shoes', SHOES: 'shoes', SNEAKERS: 'shoes', BOTAS: 'shoes',
  HOODIE: 'hoodie', SUDADERA: 'hoodie', CHAQUETA: 'jacket', JACKET: 'jacket',
  ACCESORIOS: 'accessories', CASCO: 'accessories', GORRA: 'accessories',
  VESTIDO: 'vestido', DRESS: 'vestido', RINES: 'rines',
};

function mapAICategory(text: string): string | undefined {
  const normalized = text.toUpperCase().trim();
  if (AI_CATEGORY_MAP[normalized]) return AI_CATEGORY_MAP[normalized];
  for (const key of Object.keys(AI_CATEGORY_MAP)) {
    if (normalized.includes(key)) return AI_CATEGORY_MAP[key];
  }
  return undefined;
}

const BADGE_OPTIONS = [
  { value: '', label: 'Sin badge' }, { value: 'nuevo', label: 'Nuevo' },
  { value: 'top', label: 'Top' }, { value: 'oferta', label: 'Oferta' },
];

function buildProxyImageUrl(url: string): string {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com';
  if (!url || url.includes('/api/pruebalo/img-proxy?url=')) return url;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const isInternalAsset = host.endsWith('lookitry.com') || host.endsWith('supabase.co') || host.endsWith('minio.wilkiedevs.com');
    if (isInternalAsset) return url;
    return `${apiBase}/api/pruebalo/img-proxy?url=${encodeURIComponent(url)}`;
  } catch { return url; }
}

interface DynamicAttributesProps {
  category: string;
  attributes: Record<string, any>;
  onChange: (attributes: Record<string, any>) => void;
}

function DynamicAttributes({ category, attributes, onChange }: DynamicAttributesProps) {
  const [categoryAttrs, setCategoryAttrs] = useState<CategoryAttribute | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadAttributes() {
      setLoading(true);
      try {
        const attrs = await categoryAttributesService.getByCategory(category);
        setCategoryAttrs(attrs);
        if (!attrs) {
          const generalAttrs = await categoryAttributesService.getByCategory('general');
          setCategoryAttrs(generalAttrs);
        }
      } catch (error) {
        console.error('Error loading category attributes:', error);
        setCategoryAttrs(null);
      } finally {
        setLoading(false);
      }
    }
    loadAttributes();
  }, [category]);

  if (loading) {
    return (
      <div className="space-y-2">
        <p className="text-xs text-[var(--text-muted)]">Cargando atributos...</p>
        <div className="h-8 bg-[var(--bg-card)] rounded animate-pulse" />
      </div>
    );
  }

  if (!categoryAttrs || !categoryAttrs.attributes.length) return null;

  const handleChange = (key: string, value: any) => onChange({ ...attributes, [key]: value });
  const handleTagToggle = (key: string, option: string) => {
    const currentTags = attributes[key] || [];
    handleChange(key, currentTags.includes(option) ? currentTags.filter((t: string) => t !== option) : [...currentTags, option]);
  };

  return (
    <div className="space-y-4 p-4 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)]">
      <div className="flex items-center gap-2 border-b border-[var(--border-color)] pb-2">
        <svg className="w-4 h-4 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          Atributos de {categoryAttrs.categoryLabel}
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categoryAttrs.attributes.map((attr: AttributeDefinition) => (
          <div key={attr.key} className="space-y-1.5">
            <label className="block text-xs font-medium text-[var(--text-secondary)]">{attr.label}</label>
            {attr.type === 'text' && (
              <input type="text" value={attributes[attr.key] || ''} onChange={(e) => handleChange(attr.key, e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[#FF5C3A] transition-colors"
                placeholder={`Ej: ${attr.options?.[0] || 'Valor'}`} />
            )}
            {attr.type === 'number' && (
              <input type="number" value={attributes[attr.key] || ''} onChange={(e) => handleChange(attr.key, e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-3 py-2 text-sm bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[#FF5C3A] transition-colors" />
            )}
            {attr.type === 'select' && attr.options && (
              <select value={attributes[attr.key] || ''} onChange={(e) => handleChange(attr.key, e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[#FF5C3A] transition-colors">
                <option value="">Seleccionar...</option>
                {attr.options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            )}
            {attr.type === 'tags' && attr.options && (
              <div className="flex flex-wrap gap-2">
                {attr.options.map((opt) => {
                  const isSelected = (attributes[attr.key] || []).includes(opt);
                  return (
                    <button key={opt} type="button" onClick={() => handleTagToggle(attr.key, opt)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${isSelected ? 'bg-[#FF5C3A] text-white border-[#FF5C3A]' : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-[#FF5C3A]'}`}>
                      {opt}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProductForm({ product, showExternalId = false, onSubmit, onCancel }: ProductFormProps) {
  const [formData, setFormData] = useState<CreateProductDto & { short_description?: string; attributes?: Record<string, any> }>({ 
    name: '', description: '', short_description: '', imageUrl: '', category: 'tshirt', 
    price: undefined, badge: undefined, externalId: undefined, attributes: {},
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [compressionInfo, setCompressionInfo] = useState<string | null>(null);
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [describingWithAI, setDescribingWithAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiGenerated, setAiGenerated] = useState(false);
  const [showDescTooltip, setShowDescTooltip] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canDescribeWithAI = !!formData.imageUrl && !!formData.name.trim();
  const imagePreviewSrc = imagePreview ? buildProxyImageUrl(imagePreview) : null;

  const autoTriggeredRef = useRef(false);
  useEffect(() => {
    if (!formData.imageUrl || !formData.name.trim()) { autoTriggeredRef.current = false; return; }
    if (autoTriggeredRef.current || aiGenerated || describingWithAI || !!product) return;
    autoTriggeredRef.current = true;
    triggerDescribeWithAI(formData.imageUrl, formData.name.trim(), formData.category === 'other' ? customCategory : formData.category);
  }, [formData.imageUrl, formData.name]);

  useEffect(() => {
    if (product) {
      const isCustom = !STANDARD_CATEGORIES.includes(product.category);
      setFormData({ name: product.name, description: product.description || '', short_description: product.shortDescription || '',
        imageUrl: product.imageUrl, category: isCustom ? 'other' : product.category, price: product.price ?? undefined,
        badge: product.badge ?? undefined, externalId: product.externalId ?? undefined, attributes: product.attributes || {} });
      setImagePreview(product.imageUrl);
      if (isCustom) { setShowCustomCategory(true); setCustomCategory(product.category); }
    }
  }, [product]);

  const handleImageFile = async (file: File) => {
    setErrors(p => ({ ...p, imageUrl: '' })); setCompressionInfo(null);
    const validation = validateImageFile(file);
    if (!validation.valid) { setErrors(p => ({ ...p, imageUrl: validation.error || 'Archivo inválido' })); return; }
    try {
      setCompressing(true);
      const originalSize = file.size;
      const compressed = await compressImage(file, { maxWidth: 1920, maxHeight: 1920, quality: 0.85, maxSizeMB: 5 });
      const saved = Math.round(((originalSize - compressed.size) / originalSize) * 100);
      if (saved > 10) setCompressionInfo(`Optimizada: ${formatFileSize(originalSize)} → ${formatFileSize(compressed.size)} (${saved}% reducido)`);
      const base64 = await new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = e => res(e.target?.result as string); r.onerror = rej; r.readAsDataURL(compressed); });
      const ts = new Date().toISOString().replace(/[:.]/g, '-');
      const url = await uploadService.uploadImage(base64.split(',')[1], `product-${ts}.jpg`, false);
      setImagePreview(url); setFormData(p => ({ ...p, imageUrl: url }));
      if (formData.name.trim() && !product) triggerDescribeWithAI(url, formData.name.trim(), formData.category === 'other' ? customCategory : formData.category);
    } catch (err: any) { setErrors(p => ({ ...p, imageUrl: err.message || 'Error al procesar la imagen' })); } 
    finally { setCompressing(false); }
  };

  const triggerDescribeWithAI = async (imageUrl: string, productName: string, category: string) => {
    setDescribingWithAI(true); setAiError(null);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com';
      const res = await fetch(`${apiBase}/api/products/describe-ai`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ image_url: imageUrl, product_name: productName, category }),
      });
      if (!res.ok) { const errorData = await res.json().catch(() => ({})); throw new Error(errorData?.message || 'Error al conectar con el servicio de IA'); }
      const raw = await res.text();
      if (!raw?.trim()) throw new Error('El servicio de IA no devolvió respuesta');
      let description = '', aiCategory: string | undefined;
      try { const data = JSON.parse(raw); description = data.description || data.text || ''; aiCategory = data.category; } catch { description = raw.trim(); }
      if (!description) throw new Error('La IA no devolvió una descripción');
      const clean = description.replace(/#{1,6}\s*/g, '').replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1').replace(/\n{3,}/g, '\n\n').trim();
      let mappedCategory = category, mappedCustom = '';
      if (aiCategory) { const mapped = mapAICategory(aiCategory); if (mapped) { mappedCategory = mapped; if (mapped === 'other') mappedCustom = aiCategory.charAt(0).toUpperCase() + aiCategory.slice(1).toLowerCase(); } }
      setFormData(p => ({ ...p, description: clean, category: mappedCategory }));
      setShowCustomCategory(mappedCategory === 'other'); setCustomCategory(mappedCustom); setAiGenerated(true);
    } catch (err: any) { setAiError(err.message || 'Error al generar descripción'); } 
    finally { setDescribingWithAI(false); }
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!formData.name.trim()) e.name = 'El nombre es requerido';
    if (!formData.imageUrl.trim()) e.imageUrl = 'La imagen es requerida';
    else { try { new URL(formData.imageUrl); } catch { e.imageUrl = 'Debe ser una URL válida'; } }
    if (!formData.category) e.category = 'La categoría es requerida';
    if (formData.category === 'other' && !customCategory.trim()) e.customCategory = 'Especifica la categoría';
    if (formData.short_description && formData.short_description.length > 500) e.short_description = 'Máx 500 caracteres';
    setErrors(e); return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await onSubmit({
        ...formData, category: formData.category === 'other' ? customCategory.trim() : formData.category,
        price: formData.price ? Number(formData.price) : undefined, badge: formData.badge || undefined,
        externalId: formData.externalId || undefined,
      });
    } catch { /* error manejado por el padre */ } finally { setIsSubmitting(false); }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'category') { setShowCustomCategory(value === 'other'); if (value !== 'other') setCustomCategory(''); setFormData(p => ({ ...p, [name]: value, attributes: {} })); }
    else setFormData(p => ({ ...p, [name]: value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }));
  };

  const inputBaseStyle = { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', fontSize: '0.875rem', width: '100%', outline: 'none', border: '1px solid var(--border-color)' };

  return (
    <Card>
      <CardHeader><h3 className="font-syne font-semibold text-base" style={{ color: 'var(--text-primary)' }}>{product ? 'Editar Producto' : 'Nuevo Producto'}</h3></CardHeader>
      <CardBody>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input label="Nombre" name="name" value={formData.name} onChange={handleChange} error={errors.name} placeholder="Ej: Camiseta Logo" required />
          {showExternalId && <Input label="ID Externo (WooCommerce/Shopify)" name="externalId" value={formData.externalId || ''} onChange={handleChange} error={errors.externalId} placeholder="Ej: 12345 (opcional)" />}
          
          {/* Imagen */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Imagen del Producto</label>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={compressing} size="sm">{compressing ? 'Procesando...' : 'Subir prenda'}</Button>
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>o ingresa una URL</span>
                <a href="https://www.photoroom.com/tools/background-remover" target="_blank" rel="noopener noreferrer" className="ml-auto text-[11px] font-semibold text-[#FF5C3A] hover:bg-[#FF5C3A]/10 border border-[#FF5C3A]/30 px-2 py-1.5 rounded-lg">Quitar fondo</a>
              </div>
              <Input name="imageUrl" value={formData.imageUrl} onChange={handleChange} error={errors.imageUrl} placeholder="https://ejemplo.com/imagen.jpg" required />
              <input ref={fileInputRef} type="file" className="hidden" accept="image/jpeg,image/png,image/webp" onChange={e => e.target.files?.[0] && handleImageFile(e.target.files[0])} />
              {compressionInfo && <p className="text-xs" style={{ color: '#10b981' }}>{compressionInfo}</p>}
              {imagePreviewSrc && <img src={imagePreviewSrc} alt="Preview" className="w-full max-w-[200px] object-cover rounded-lg border" style={{ borderColor: 'var(--border-color)' }} />}
            </div>
          </div>

          {/* Descripción Corta (Visible para clientes) */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Descripción Corta</label>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-500 font-medium">Visible para clientes</span>
            </div>
            <textarea name="short_description" value={formData.short_description || ''} onChange={handleChange} rows={2}
              style={inputBaseStyle} placeholder="Ej: Perfecta para summer vibes ☀️ Ideal para casual y beach days"
              className="resize-none" />
            {errors.short_description && <p className="mt-1 text-xs text-red-500">{errors.short_description}</p>}
            <p className="mt-1 text-[10px]" style={{ color: 'var(--text-muted)' }}>Máx 500 caracteres. Esta descripción aparece en la tarjeta del producto.</p>
          </div>

          {/* Descripción IA (Interna) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Descripción IA <span className="text-[10px] text-[var(--text-muted)]">(Interna)</span></label>
                <button type="button" onClick={() => setShowDescTooltip(!showDescTooltip)} className="p-1 rounded-full hover:bg-[var(--bg-hover)]">
                  <svg className="w-3.5 h-3.5" style={{ color: showDescTooltip ? '#FF5C3A' : 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </button>
                <AnimatePresence>
                  {showDescTooltip && (
                    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="absolute mt-2 w-64 bg-[#1a1a1a] border border-[#333] text-white text-xs rounded-xl p-3 z-50">
                      <p>Usada <strong>internamente</strong> para el probador virtual. <strong>No visible para clientes.</strong></p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="flex items-center gap-2">
                {aiGenerated && <button type="button" onClick={() => setAiGenerated(false)} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs" style={{ border: '1px solid var(--border-color)' }}>Editar</button>}
                <button type="button" onClick={() => canDescribeWithAI && triggerDescribeWithAI(formData.imageUrl, formData.name.trim(), formData.category === 'other' ? customCategory : formData.category)}
                  disabled={!canDescribeWithAI || describingWithAI}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium disabled:opacity-40" style={{ background: 'rgba(255,92,58,0.1)', color: '#FF5C3A', border: '1px solid rgba(255,92,58,0.25)' }}>
                  {describingWithAI ? <><svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>Analizando...</> : 'Describir con IA'}
                </button>
              </div>
            </div>
            {aiGenerated ? (
              <div className="rounded-lg px-3 py-2 text-sm relative" style={{ backgroundColor: 'rgba(255,92,58,0.04)', border: '1px solid rgba(255,92,58,0.2)', minHeight: '72px', whiteSpace: 'pre-wrap' }}>
                <span className="absolute top-1.5 right-2 text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,92,58,0.12)', color: '#FF5C3A' }}>IA</span>
                {formData.description || <span style={{ color: 'var(--text-muted)' }}>Sin descripción</span>}
              </div>
            ) : (
              <textarea name="description" value={formData.description} onChange={handleChange} rows={3} style={{ ...inputBaseStyle, resize: 'vertical' }} placeholder="Descripción interna para el probador (opcional)" />
            )}
            {aiError && <p className="mt-1 text-xs text-red-500">{aiError}</p>}
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Categoría</label>
            {aiGenerated ? (
              <div className="rounded-lg px-3 py-2 text-sm flex items-center justify-between" style={{ backgroundColor: 'rgba(255,92,58,0.04)', border: '1px solid rgba(255,92,58,0.2)' }}>
                <span>{formData.category === 'other' ? customCategory || 'Otro' : CATEGORY_LABELS[formData.category] ?? formData.category}</span>
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,92,58,0.12)', color: '#FF5C3A' }}>IA</span>
              </div>
            ) : (
              <>
                <select name="category" value={formData.category} onChange={handleChange} style={inputBaseStyle} required>
                  {[...STANDARD_CATEGORIES, 'other'].map(c => <option key={c} value={c}>{CATEGORY_LABELS[c] ?? c}</option>)}
                </select>
                {errors.category && <p className="mt-1 text-xs text-red-500">{errors.category}</p>}
                {showCustomCategory && <div className="mt-3"><Input label="Especificar categoría" name="customCategory" value={customCategory} onChange={(e) => { setCustomCategory(e.target.value); setErrors(p => ({ ...p, customCategory: '' })); }} error={errors.customCategory} placeholder="Ej: Gorras, Bufandas..." required /></div>}
              </>
            )}
          </div>

          {/* Atributos Dinámicos */}
          {formData.category && formData.category !== 'other' && (
            <DynamicAttributes category={formData.category} attributes={formData.attributes || {}} onChange={(attrs) => setFormData(p => ({ ...p, attributes: attrs }))} />
          )}

          {/* Precio y Badge */}
          <div className="flex gap-3">
            <div className="flex-1 space-y-1.5">
              <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Precio (COP)</label>
              <input type="number" name="price" value={formData.price ?? ''} onChange={(e) => setFormData(p => ({ ...p, price: e.target.value ? Number(e.target.value) : undefined }))}
                min={0} placeholder="Ej: 89000" style={inputBaseStyle} />
            </div>
            <div className="flex-1 space-y-1.5">
              <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Badge</label>
              <select name="badge" value={formData.badge ?? ''} onChange={(e) => setFormData(p => ({ ...p, badge: e.target.value as any || undefined }))} style={inputBaseStyle}>
                {BADGE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={isSubmitting} className="flex-1">{isSubmitting ? 'Guardando...' : product ? 'Actualizar' : 'Crear'}</Button>
            <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting} className="flex-1">Cancelar</Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
