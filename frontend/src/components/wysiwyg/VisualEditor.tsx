'use client';

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MousePointer2, 
  Check, 
  X, 
  Type,
  Palette,
  Image as ImageIcon,
  Share2,
  Save
} from 'lucide-react';

export type VisualEditField =
  | 'slogan'
  | 'brand_description'
  | 'ctaButtonText'
  | 'instagram'
  | 'facebook'
  | 'tiktok'
  | 'youtube'
  | 'x'
  | 'whatsapp'
  | 'cityDisplay'
  | 'primaryColor'
  | 'secondaryColor';

interface VisualEditorProps {
  children: React.ReactNode;
  className?: string;
}

interface VisualEditorContextValue {
  isVisualMode: boolean;
  toggleVisualMode: () => void;
  activeField: VisualEditField | null;
  setActiveField: (field: VisualEditField | null) => void;
  editValues: Partial<Record<VisualEditField, string>>;
  updateEditValue: (field: VisualEditField, value: string) => void;
  commitEdit: (field: VisualEditField) => void;
  cancelEdit: (field: VisualEditField) => void;
}

const VisualEditorContext = React.createContext<VisualEditorContextValue | null>(null);

export function useVisualEditor() {
  const ctx = React.useContext(VisualEditorContext);
  if (!ctx) {
    return {
      isVisualMode: false,
      toggleVisualMode: () => {},
      activeField: null,
      setActiveField: () => {},
      editValues: {},
      updateEditValue: () => {},
      commitEdit: () => {},
      cancelEdit: () => {},
    };
  }
  return ctx;
}

export function VisualEditorProvider({ children }: { children: React.ReactNode }) {
  const [isVisualMode, setIsVisualMode] = useState(false);
  const [activeField, setActiveField] = useState<VisualEditField | null>(null);
  const [editValues, setEditValues] = useState<Partial<Record<VisualEditField, string>>>({});

  const toggleVisualMode = useCallback(() => {
    setIsVisualMode(prev => !prev);
    setActiveField(null);
    setEditValues({});
  }, []);

  const updateEditValue = useCallback((field: VisualEditField, value: string) => {
    setEditValues(prev => ({ ...prev, [field]: value }));
  }, []);

  const commitEdit = useCallback((field: VisualEditField) => {
    setActiveField(null);
  }, []);

  const cancelEdit = useCallback((field: VisualEditField) => {
    setEditValues(prev => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setActiveField(null);
  }, []);

  return (
    <VisualEditorContext.Provider value={{
      isVisualMode,
      toggleVisualMode,
      activeField,
      setActiveField,
      editValues,
      updateEditValue,
      commitEdit,
      cancelEdit,
    }}>
      {children}
    </VisualEditorContext.Provider>
  );
}

interface EditableTextProps {
  field: VisualEditField;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  multiline?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function EditableText({ 
  field, 
  value, 
  onChange, 
  children, 
  multiline = false, 
  className = '',
  style 
}: EditableTextProps) {
  const { isVisualMode, activeField, setActiveField, editValues, updateEditValue, commitEdit, cancelEdit } = useVisualEditor();
  const [localValue, setLocalValue] = useState('');
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const isActive = activeField === field;

  const handleClick = (e: React.MouseEvent) => {
    if (!isVisualMode) return;
    e.stopPropagation();
    setActiveField(field);
    setLocalValue(editValues[field] ?? value);
  };

  const handleCommit = () => {
    onChange(localValue);
    commitEdit(field);
  };

  const handleCancel = () => {
    setLocalValue('');
    cancelEdit(field);
  };

  const handleBlur = () => {
    setTimeout(() => {
      if (!document.activeElement?.closest?.('[data-vedit]')) {
        handleCommit();
      }
    }, 150);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !multiline) {
      e.preventDefault();
      handleCommit();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  if (!isVisualMode) {
    return (
      <span className={className} style={style} onClick={handleClick}>
        {children}
      </span>
    );
  }

  return (
    <span
      className={`relative inline-block cursor-pointer transition-all duration-200 ${isActive ? 'z-50' : 'hover:ring-2 hover:ring-[#FF5C3A]/50 hover:ring-offset-1 rounded'} ${className}`}
      style={style}
      onClick={handleClick}
      data-vedit={field}
    >
      {isActive ? (
        <span className="absolute inset-0 -translate-y-1" onClick={e => e.stopPropagation()}>
          {multiline ? (
            <textarea
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              value={localValue}
              onChange={e => {
                setLocalValue(e.target.value);
                updateEditValue(field, e.target.value);
              }}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className="w-full min-h-[60px] p-2 text-sm bg-white border-2 border-[#FF5C3A] rounded-lg shadow-xl resize-none"
              rows={3}
              autoFocus
            />
          ) : (
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type="text"
              value={localValue}
              onChange={e => {
                setLocalValue(e.target.value);
                updateEditValue(field, e.target.value);
              }}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className="w-full px-2 py-1 text-sm bg-white border-2 border-[#FF5C3A] rounded-lg shadow-xl"
              autoFocus
            />
          )}
        </span>
      ) : (
        <span className="pointer-events-none">{children}</span>
      )}
    </span>
  );
}

interface EditableColorProps {
  field: VisualEditField;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function EditableColor({ field, value, onChange, className = '' }: EditableColorProps) {
  const { isVisualMode, activeField, setActiveField, editValues, updateEditValue, commitEdit, cancelEdit } = useVisualEditor();
  const [localValue, setLocalValue] = useState('');
  const isActive = activeField === field;

  const handleClick = (e: React.MouseEvent) => {
    if (!isVisualMode) return;
    e.stopPropagation();
    setActiveField(field);
    setLocalValue(editValues[field] ?? value);
  };

  const handleCommit = () => {
    if (/^#[0-9A-Fa-f]{6}$/.test(localValue)) {
      onChange(localValue);
    }
    commitEdit(field);
  };

  const handleCancel = () => {
    setLocalValue('');
    cancelEdit(field);
  };

  if (!isVisualMode) {
    return (
      <span
        className={`inline-block w-6 h-6 rounded-full cursor-pointer transition-transform hover:scale-110 ${className}`}
        style={{ backgroundColor: value }}
        onClick={handleClick}
      />
    );
  }

  return (
    <span
      className={`relative inline-block cursor-pointer transition-all ${isActive ? 'z-50 scale-110' : 'hover:scale-110'} ${className}`}
      onClick={handleClick}
      data-vedit={field}
    >
      <span className="block w-6 h-6 rounded-full ring-2 ring-white shadow-lg" style={{ backgroundColor: isActive ? localValue : value }} />
      {isActive && (
        <span className="absolute -top-1 -right-1 flex gap-0.5" onClick={e => e.stopPropagation()}>
          <button
            onClick={handleCommit}
            className="w-4 h-4 bg-emerald-500 text-white rounded-full flex items-center justify-center hover:bg-emerald-600"
          >
            <Check className="w-2.5 h-2.5" />
          </button>
          <button
            onClick={handleCancel}
            className="w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
          >
            <X className="w-2.5 h-2.5" />
          </button>
        </span>
      )}
      {isActive && (
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
      )}
    </span>
  );
}

interface VisualModeToggleProps {
  className?: string;
}

export function VisualModeToggle({ className = '' }: VisualModeToggleProps) {
  const { isVisualMode, toggleVisualMode } = useVisualEditor();

  return (
    <motion.button
      onClick={toggleVisualMode}
      className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all shadow-xl ${
        isVisualMode
          ? 'bg-[#FF5C3A] text-white shadow-[#FF5C3A]/20'
          : 'bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border-color)] hover:border-[#FF5C3A]/50'
      } ${className}`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <MousePointer2 className={`w-5 h-5 ${isVisualMode ? 'animate-pulse' : ''}`} />
      {isVisualMode ? 'Salir del Editor Visual' : 'Editar Visualmente'}
    </motion.button>
  );
}

interface VisualModeIndicatorProps {
  className?: string;
}

export function VisualModeIndicator({ className = '' }: VisualModeIndicatorProps) {
  const { isVisualMode, activeField } = useVisualEditor();

  return (
    <AnimatePresence>
      {isVisualMode && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-4 px-6 py-3 bg-[#0a0a0a] border border-[#FF5C3A] rounded-2xl shadow-2xl shadow-black/50 ${className}`}
        >
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF5C3A] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#FF5C3A]"></span>
            </span>
            <span className="text-xs font-bold uppercase tracking-widest text-white">
              Modo Editor Visual
            </span>
          </div>
          
          <div className="flex items-center gap-2 pl-4 border-l border-white/20">
            {[
              { icon: <Type className="w-4 h-4" />, label: 'Textos' },
              { icon: <Palette className="w-4 h-4" />, label: 'Colores' },
              { icon: <ImageIcon className="w-4 h-4" />, label: 'Imagen' },
              { icon: <Share2 className="w-4 h-4" />, label: 'Redes' },
            ].map(({ icon, label }) => (
              <span key={label} className="flex items-center gap-1.5 px-2 py-1 bg-white/10 rounded-lg text-white/70">
                {icon}
                <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2 text-[10px] text-white/50">
            <span>Click</span>
            <span className="px-1.5 py-0.5 bg-white/20 rounded font-mono">Enter</span>
            <span>guardar</span>
            <span className="px-1.5 py-0.5 bg-white/20 rounded font-mono">Esc</span>
            <span>cancelar</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
