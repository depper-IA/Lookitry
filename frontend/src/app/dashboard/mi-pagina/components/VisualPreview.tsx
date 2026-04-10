'use client';

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Eye, 
  Type,
  Palette,
  Image as ImageIcon,
  Share2,
  Check,
  X
} from 'lucide-react';
import { LandingPreview } from './LandingPreview';
import { 
  EditableText, 
  EditableColor, 
  useVisualEditor, 
  VisualEditField 
} from '@/components/wysiwyg/VisualEditor';

interface VisualPreviewProps {
  brandSlug: string;
  brand: any;
  products: any[];
  onFieldChange: (field: VisualEditField, value: any) => void;
}

export function VisualPreview({ brandSlug, brand, products, onFieldChange }: VisualPreviewProps) {
  const { isVisualMode } = useVisualEditor();

  return (
    <div className={`relative ${isVisualMode ? 'ring-4 ring-[#FF5C3A]/30 ring-offset-4 ring-offset-[var(--bg-card)]' : ''}`}>
      {isVisualMode && (
        <VisualOverlay brand={brand} onFieldChange={onFieldChange} />
      )}
      <div className={isVisualMode ? 'pointer-events-none opacity-60' : ''}>
        <LandingPreview 
          brandSlug={brandSlug} 
          brand={brand} 
          products={products} 
          isPreview={true} 
        />
      </div>
    </div>
  );
}

interface VisualOverlayProps {
  brand: any;
  onFieldChange: (field: VisualEditField, value: any) => void;
}

function VisualOverlay({ brand, onFieldChange }: VisualOverlayProps) {
  const { 
    activeField, 
    setActiveField, 
    editValues, 
    updateEditValue, 
    commitEdit, 
    cancelEdit 
  } = useVisualEditor();

  const handleCommit = useCallback((field: VisualEditField) => {
    const value = editValues[field];
    if (value !== undefined) {
      onFieldChange(field, value);
    }
    commitEdit(field);
  }, [editValues, onFieldChange, commitEdit]);

  return (
    <div className="absolute inset-0 z-50 pointer-events-auto">
      {/* Floating Toolbar */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-[#0a0a0a]/95 backdrop-blur border border-[#FF5C3A] rounded-2xl shadow-2xl"
      >
        <span className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-widest">
          <span className="w-2 h-2 rounded-full bg-[#FF5C3A] animate-pulse" />
          Editor Visual
        </span>
        <div className="h-4 w-px bg-white/20" />
        <div className="flex items-center gap-1">
          <span className="p-1.5 bg-white/10 rounded-lg text-white/70" title="Textos">
            <Type className="w-4 h-4" />
          </span>
          <span className="p-1.5 bg-white/10 rounded-lg text-white/70" title="Colores">
            <Palette className="w-4 h-4" />
          </span>
          <span className="p-1.5 bg-white/10 rounded-lg text-white/70" title="Imágenes">
            <ImageIcon className="w-4 h-4" />
          </span>
          <span className="p-1.5 bg-white/10 rounded-lg text-white/70" title="Redes">
            <Share2 className="w-4 h-4" />
          </span>
        </div>
        <div className="h-4 w-px bg-white/20" />
        <span className="text-[10px] text-white/50">
          Click en elementos para editar
        </span>
      </motion.div>

      {/* Clickable Editable Zones - These are invisible overlays positioned over the preview */}
      
      {/* Slogan Zone */}
      <EditableZone
        field="slogan"
        position="top-[25%] left-[10%] w-[35%] h-[8%]"
        preview={brand.slogan || 'Colección 2026'}
        onCommit={handleCommit}
      />

      {/* Description Zone */}
      <EditableZone
        field="brand_description"
        position="top-[35%] left-[10%] w-[40%] h-[10%]"
        preview={brand.brand_description || 'Descripción de tu marca'}
        multiline
        onCommit={handleCommit}
      />

      {/* CTA Button Zone */}
      <EditableZone
        field="ctaButtonText"
        position="bottom-[58%] right-[25%] w-[20%] h-[6%]"
        preview={brand.cta_button_text || 'Probarme esto'}
        onCommit={handleCommit}
      />

      {/* Primary Color Zone */}
      <EditableColorZone
        field="primaryColor"
        position="top-[92%] left-[15%] w-[5%] h-[4%]"
        value={brand.primary_color || '#FF5C3A'}
        onCommit={handleCommit}
      />

      {/* Secondary Color Zone */}
      <EditableColorZone
        field="secondaryColor"
        position="top-[92%] left-[25%] w-[5%] h-[4%]"
        value={brand.secondary_color || '#FF5C3A'}
        onCommit={handleCommit}
      />

      {/* Instagram Zone */}
      <EditableZone
        field="instagram"
        position="bottom-[18%] left-[8%] w-[15%] h-[4%]"
        preview={brand.social_links?.instagram || '@tuinstagram'}
        onCommit={handleCommit}
      />

      {/* City Zone */}
      <EditableZone
        field="cityDisplay"
        position="bottom-[25%] left-[8%] w-[20%] h-[4%]"
        preview={brand.city_display || 'Ciudad de ubicación'}
        onCommit={handleCommit}
      />
    </div>
  );
}

interface EditableZoneProps {
  field: VisualEditField;
  position: string;
  preview: string;
  multiline?: boolean;
  onCommit: (field: VisualEditField) => void;
}

function EditableZone({ field, position, preview, multiline, onCommit }: EditableZoneProps) {
  const { activeField, setActiveField, editValues, updateEditValue, commitEdit, cancelEdit } = useVisualEditor();
  const [localValue, setLocalValue] = useState('');
  const isActive = activeField === field;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveField(field);
    setLocalValue(editValues[field] ?? preview);
  };

  const handleCommit = () => {
    const value = editValues[field] ?? preview;
    onCommit(field);
  };

  const handleCancel = () => {
    setLocalValue('');
    cancelEdit(field);
  };

  return (
    <div
      className={`absolute ${position} cursor-pointer transition-all duration-200 ${
        isActive ? 'z-[60]' : 'hover:z-[55] hover:ring-2 hover:ring-[#FF5C3A]/60 hover:ring-offset-1 hover:ring-offset-white/50'
      } rounded-lg`}
      onClick={handleClick}
      data-vedit={field}
    >
      {isActive ? (
        <div className="w-full h-full bg-white/95 backdrop-blur border-2 border-[#FF5C3A] rounded-lg shadow-2xl p-1" onClick={e => e.stopPropagation()}>
          {multiline ? (
            <textarea
              value={localValue}
              onChange={e => {
                setLocalValue(e.target.value);
                updateEditValue(field, e.target.value);
              }}
              onBlur={() => setTimeout(handleCommit, 150)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleCommit();
                }
                if (e.key === 'Escape') {
                  e.preventDefault();
                  handleCancel();
                }
              }}
              className="w-full h-full p-1 text-xs bg-transparent border-0 outline-none resize-none"
              autoFocus
              placeholder="Escribe aquí..."
            />
          ) : (
            <input
              type="text"
              value={localValue}
              onChange={e => {
                setLocalValue(e.target.value);
                updateEditValue(field, e.target.value);
              }}
              onBlur={() => setTimeout(handleCommit, 150)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleCommit();
                }
                if (e.key === 'Escape') {
                  e.preventDefault();
                  handleCancel();
                }
              }}
              className="w-full h-full px-2 text-xs bg-transparent border-0 outline-none"
              autoFocus
              placeholder="Escribe aquí..."
            />
          )}
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
          <span className="px-2 py-1 bg-[#FF5C3A] text-white text-[10px] font-bold uppercase rounded shadow-lg">
            Editar
          </span>
        </div>
      )}
    </div>
  );
}

interface EditableColorZoneProps {
  field: VisualEditField;
  position: string;
  value: string;
  onCommit: (field: VisualEditField) => void;
}

function EditableColorZone({ field, position, value, onCommit }: EditableColorZoneProps) {
  const { activeField, setActiveField, editValues, updateEditValue, commitEdit, cancelEdit } = useVisualEditor();
  const [localValue, setLocalValue] = useState('');
  const isActive = activeField === field;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveField(field);
    setLocalValue(editValues[field] ?? value);
  };

  const handleCommit = () => {
    const finalValue = editValues[field] ?? value;
    if (/^#[0-9A-Fa-f]{6}$/.test(finalValue)) {
      onCommit(field);
    } else {
      cancelEdit(field);
    }
  };

  const displayValue = isActive ? localValue : value;

  return (
    <div
      className={`absolute ${position} cursor-pointer transition-all duration-200 ${
        isActive ? 'z-[60] scale-125' : 'hover:z-[55] hover:scale-110'
      } rounded-full`}
      onClick={handleClick}
      data-vedit={field}
    >
      <div 
        className="w-full h-full rounded-full shadow-lg border-2 border-white"
        style={{ backgroundColor: displayValue }}
      />
      {isActive && (
        <div className="absolute -top-1 -right-1 flex gap-0.5" onClick={e => e.stopPropagation()}>
          <button
            onClick={handleCommit}
            className="w-4 h-4 bg-emerald-500 text-white rounded-full flex items-center justify-center hover:bg-emerald-600 shadow-lg"
          >
            <Check className="w-2.5 h-2.5" />
          </button>
        </div>
      )}
      <input
        type="color"
        value={localValue}
        onChange={e => {
          setLocalValue(e.target.value);
          updateEditValue(field, e.target.value);
        }}
        onBlur={handleCommit}
        className="absolute inset-0 opacity-0 cursor-pointer"
        autoFocus
      />
    </div>
  );
}
