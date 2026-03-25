'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
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

// Mapa de categorías devueltas por n8n → valores del select
const AI_CATEGORY_MAP: Record<string, string> = {
  // Camisetas / tops
  CAMISA: 'tshirt', SHIRT: 'tshirt', TOP: 'tshirt', TSHIRT: 'tshirt', 'T-SHIRT': 'tshirt',
  BLUSA: 'tshirt', BLOUSE: 'tshirt',
  // Pantalones
  PANTALON: 'pants', PANTS: 'pants', JEANS: 'pants', SHORTS: 'pants', FALDA: 'pants', SKIRT: 'pants',
  // Zapatos
  ZAPATOS: 'shoes', SHOES: 'shoes', SNEAKERS: 'shoes', BOOTS: 'shoes', BOTAS: 'shoes',
  SANDALS: 'shoes', SANDALIAS: 'shoes', TENIS: 'shoes',
  // Hoodie
  HOODIE: 'hoodie', SUDADERA: 'hoodie', SWEATSHIRT: 'hoodie',
  // Chaqueta
  CHAQUETA: 'jacket', JACKET: 'jacket', COAT: 'jacket', ABRIGO: 'jacket',
  // Accesorios — incluye cascos, gorras, bolsos, etc.
  ACCESORIOS: 'accessories', ACCESSORIES: 'accessories',
  CASCO: 'accessories', HELMET: 'accessories',
  GORRA: 'accessories', HAT: 'accessories', CAP: 'accessories',
  BOLSO: 'accessories', BAG: 'accessories', PURSE: 'accessories',
  CINTURON: 'accessories', BELT: 'accessories',
  BUFANDA: 'accessories', SCARF: 'accessories',
  GAFAS: 'accessories', GLASSES: 'accessories', SUNGLASSES: 'accessories',
  RELOJ: 'accessories', WATCH: 'accessories',
  COLLAR: 'accessories', NECKLACE: 'accessories',
  PULSERA: 'accessories', BRACELET: 'accessories',
  ARETES: 'accessories', EARRINGS: 'accessories',
  GUANTES: 'accessories', GLOVES: 'accessories',
  // Vestidos / conjuntos → other
  VESTIDO: 'other', DRESS: 'other',
  CONJUNTO: 'other', SET: 'other', OUTFIT: 'other',
  OVEROL: 'other', JUMPSUIT: 'other',
};

// Mapea la categoría devuelta por n8n: primero match exacto, luego match parcial por palabras
function mapAICategory(text: string): string | undefined {
  const normalized = text.toUpperCase().trim();
  // 1. Match exacto
  if (AI_CATEGORY_MAP[normalized]) return AI_CATEGORY_MAP[normalized];
  // 2. Match parcial: buscar si alguna clave está contenida en el texto
  for (const key of Object.keys(AI_CATEGORY_MAP)) {
    if (normalized.includes(key)) return AI_CATEGORY_MAP[key];
  }
  return undefined;
}

// Intenta inferir categoría desde el nombre del producto (fallback si n8n no devuelve category)
function inferCategoryFromName(productName: string): string | undefined {
  return mapAICategory(productName);
}

const BADGE_OPTIONS = [
  { value: '', label: 'Sin badge' },
  { value: 'nuevo', label: 'Nuevo' },
  { value: 'top', label: 'Top' },
  { value: 'oferta', label: 'Oferta' },
];

export function ProductForm({ product, onSubmit, onCancel }: ProductFormProps) {
  const [formData, setFormData] = useState<CreateProductDto>({ name: '', description: '', imageUrl: '', category: 'tshirt', price: undefined, badge: undefined, externalId: undefined });
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
  const [showImageTooltip, setShowImageTooltip] = useState(false);
  const [showDescTooltip, setShowDescTooltip] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canDescribeWithAI = !!formData.imageUrl && !!formData.name.trim() && !!N8N_DESCRIPTOR_URL;

  // Auto-disparar cuando el usuario termina de escribir el nombre y ya hay imagen
  const autoTriggeredRef = useRef(false);
  useEffect(() => {
    if (!formData.imageUrl || !formData.name.trim() || !N8N_DESCRIPTOR_URL) {
      autoTriggeredRef.current = false;
      return;
    }
    if (autoTriggeredRef.current || aiGenerated || describingWithAI || !!product) return;
    autoTriggeredRef.current = true;
    const category = formData.category === 'other' ? customCategory : formData.category;
    triggerDescribeWithAI(formData.imageUrl, formData.name.trim(), category);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.imageUrl, formData.name]);

  const handleDescribeWithAI = async () => {
    if (!canDescribeWithAI) return;
    const category = formData.category === 'other' ? customCategory : formData.category;
    triggerDescribeWithAI(formData.imageUrl, formData.name.trim(), category);
  };

  useEffect(() => {
    if (product) {
      const isCustom = !STANDARD_CATEGORIES.includes(product.category);
      setFormData({ name: product.name, description: product.description || '', imageUrl: product.imageUrl, category: isCustom ? 'other' : product.category, price: product.price ?? undefined, badge: product.badge ?? undefined, externalId: product.externalId ?? undefined });
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
      // Disparar auto-descripción directamente con valores actuales
      const currentName = formData.name.trim();
      const currentCategory = formData.category === 'other' ? customCategory : formData.category;
      // Solo disparar descripción automática SI NO estamos editando
      if (currentName && N8N_DESCRIPTOR_URL && !product) {
        triggerDescribeWithAI(url, currentName, currentCategory);
      }
    } catch (err: any) {
      setErrors(p => ({ ...p, imageUrl: err.message || 'Error al procesar la imagen' }));
    } finally { setCompressing(false); }
  };

  // Versión interna que acepta valores explícitos (para llamar desde handleImageFile)
  const triggerDescribeWithAI = async (imageUrl: string, productName: string, category: string) => {
    setDescribingWithAI(true);
    setAiError(null);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com';
      const token = localStorage.getItem('token');

      const res = await fetch(`${apiBase}/api/products/describe-ai`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ image_url: imageUrl, product_name: productName, category }),
      });

      if (!res.ok) throw new Error('Error al conectar con el servicio de IA');
      const raw = await res.text();
      if (!raw?.trim()) throw new Error('El servicio de IA no devolvió respuesta');
      let description = '';
      let aiCategory: string | undefined;
      try {
        const data = JSON.parse(raw);
        description = data.description || data.text || '';
        aiCategory = data.category;
      } catch { description = raw.trim(); }
      if (!description) throw new Error('La IA no devolvió una descripción');
      const clean = description
        .replace(/#{1,6}\s*/g, '').replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/\*(.+?)\*/g, '$1').replace(/\n{3,}/g, '\n\n').trim();
      let mappedCategory = category;
      let mappedCustom = '';
      if (aiCategory) {
        const mapped = mapAICategory(aiCategory);
        if (mapped) {
          mappedCategory = mapped;
          if (mapped === 'other') mappedCustom = aiCategory.charAt(0).toUpperCase() + aiCategory.slice(1).toLowerCase();
        }
      }
      // Fallback: si n8n no devolvió categoría o no hizo match, inferir desde el nombre del producto
      if (mappedCategory === category && productName) {
        const inferredFromName = inferCategoryFromName(productName);
        if (inferredFromName) mappedCategory = inferredFromName;
      }
      setFormData(p => ({ ...p, description: clean, category: mappedCategory }));
      setShowCustomCategory(mappedCategory === 'other');
      setCustomCategory(mappedCustom);
      setAiGenerated(true);
    } catch (err: any) {
      setAiError(err.message || 'Error al generar descripción');
    } finally { setDescribingWithAI(false); }
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
      await onSubmit({
        ...formData,
        category: formData.category === 'other' ? customCategory.trim() : formData.category,
        price: formData.price ? Number(formData.price) : undefined,
        badge: formData.badge || undefined,
        externalId: formData.externalId || undefined,
      });
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
          <Input label="ID Externo (WooCommerce/Shopify)" name="externalId" value={formData.externalId || ''} onChange={handleChange} error={errors.externalId} placeholder="Ej: 12345 (opcional)" />

          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Imagen del Producto</label>
              <div className="relative flex items-center">
                <button 
                  type="button"
                  onClick={() => setShowImageTooltip(!showImageTooltip)}
                  className="p-1 rounded-full hover:bg-[var(--bg-hover)] transition-colors"
                >
                  <svg className="w-3.5 h-3.5" style={{ color: showImageTooltip ? '#FF5C3A' : 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
                {/* TOOLTIP */}
                <AnimatePresence>
                  {showImageTooltip && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-[#1a1a1a] border border-[#333] text-white text-xs rounded-xl p-3 z-50 text-center shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
                    >
                      <button 
                        type="button" 
                        onClick={() => setShowImageTooltip(false)}
                        className="absolute top-2 right-2 text-white/40 hover:text-white"
                      >
                        <X size={12} />
                      </button>
                      <p className="mb-2 leading-relaxed pr-4">Sube una foto de tu prenda en alta calidad, centrada y sin perchas. Para mejores resultados, usa formato vertical (3:4) o <a href="#" target="_blank" className="text-[#FF5C3A] font-semibold hover:underline">revisa las medidas</a>.</p>
                      <p className="text-[10px] text-[#888] pb-0.5 border-t border-[#333] pt-2">Una buena iluminación garantiza una prueba virtual perfecta.</p>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-[#333]"></div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={compressing} size="sm">
                  {compressing ? 'Procesando...' : 'Subir prenda'}
                </Button>
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>o ingresa una URL</span>
                
                {/* Botón sugerido quitar fondo */}
                <a href="https://www.photoroom.com/tools/background-remover" target="_blank" rel="noopener noreferrer" className="ml-auto text-[11px] font-semibold text-[#FF5C3A] hover:bg-[#FF5C3A]/10 border border-[#FF5C3A]/30 px-2 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                  Quitar fondo a la imagen
                </a>
              </div>
              <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                💡 <strong>Recomendación:</strong> Usa imágenes en formato vertical (proporción 3:4 o 768x1024px). Asegúrate de que el producto esté centrado y se vea completo para un mejor resultado.
              </p>
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
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Descripción</label>
                <div className="relative flex items-center">
                  <button 
                    type="button"
                    onClick={() => setShowDescTooltip(!showDescTooltip)}
                    className="p-1 rounded-full hover:bg-[var(--bg-hover)] transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" style={{ color: showDescTooltip ? '#FF5C3A' : 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                  {/* TOOLTIP DESCRIPCIÓN */}
                  <AnimatePresence>
                    {showDescTooltip && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-[#1a1a1a] border border-[#333] text-white text-xs rounded-xl p-3 z-50 text-center shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
                      >
                        <button 
                          type="button" 
                          onClick={() => setShowDescTooltip(false)}
                          className="absolute top-2 right-2 text-white/40 hover:text-white"
                        >
                          <X size={12} />
                        </button>
                        <p className="leading-relaxed pr-4">Recomendamos <strong>no modificar</strong> la descripción generada por la IA para obtener una mayor precisión en la generación de la prueba virtual.</p>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-[#333]"></div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {aiGenerated && (
                  <button
                    type="button"
                    onClick={() => setAiGenerated(false)}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-opacity hover:opacity-70"
                    style={{ color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}
                  >
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Editar manualmente
                  </button>
                )}
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
            </div>
            {aiGenerated ? (
              <div
                className="rounded-lg px-3 py-2 text-sm relative"
                style={{
                  backgroundColor: 'rgba(255,92,58,0.04)',
                  border: '1px solid rgba(255,92,58,0.2)',
                  color: 'var(--text-primary)',
                  minHeight: '72px',
                  whiteSpace: 'pre-wrap',
                }}
              >
                <span className="absolute top-1.5 right-2 text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,92,58,0.12)', color: '#FF5C3A' }}>
                  IA
                </span>
                {formData.description || <span style={{ color: 'var(--text-muted)' }}>Sin descripción</span>}
              </div>
            ) : (
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                style={textareaStyle}
                placeholder="Descripción del producto (opcional, o genera una con IA)"
              />
            )}
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
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Categoría</label>
            {aiGenerated ? (
              <div
                className="rounded-lg px-3 py-2 text-sm flex items-center justify-between"
                style={{
                  backgroundColor: 'rgba(255,92,58,0.04)',
                  border: '1px solid rgba(255,92,58,0.2)',
                  color: 'var(--text-primary)',
                }}
              >
                <span>
                  {formData.category === 'other'
                    ? customCategory || 'Otro'
                    : CATEGORY_LABELS[formData.category] ?? formData.category}
                </span>
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,92,58,0.12)', color: '#FF5C3A' }}>
                  IA
                </span>
              </div>
            ) : (
              <>
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
              </>
            )}
          </div>

          <div className="flex gap-3 pt-2">
              <div className="flex-1 space-y-1.5">
                <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Precio (COP)</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price ?? ''}
                  onChange={e => setFormData(p => ({ ...p, price: e.target.value ? Number(e.target.value) : undefined }))}
                  min={0}
                  placeholder="Ej: 89000"
                  style={{ ...selectStyle }}
                />
              </div>
              <div className="flex-1 space-y-1.5">
                <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Badge</label>
                <select
                  name="badge"
                  value={formData.badge ?? ''}
                  onChange={e => setFormData(p => ({ ...p, badge: e.target.value as any || undefined }))}
                  style={selectStyle}
                >
                  {BADGE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
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
