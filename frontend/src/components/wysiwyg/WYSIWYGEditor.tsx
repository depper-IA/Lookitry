'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';

export type EditableField = 
  | 'slogan' 
  | 'brand_description' 
  | 'ctaButtonText'
  | 'name'
  | 'cityDisplay'
  | 'instagram'
  | 'facebook'
  | 'tiktok'
  | 'youtube'
  | 'x'
  | 'whatsapp'
  | 'whatsappMessage';

interface WYSIWYGContextValue {
  isWYSIWYGMode: boolean;
  toggleWYSIWYG: () => void;
  activeField: EditableField | null;
  setActiveField: (field: EditableField | null) => void;
  editedValues: Partial<Record<EditableField, string>>;
  updateEditedValue: (field: EditableField, value: string) => void;
  commitChange: (field: EditableField) => void;
  cancelChange: (field: EditableField) => void;
}

const WYSIWYGContext = React.createContext<WYSIWYGContextValue | null>(null);

export function useWYSIWYG() {
  const context = React.useContext(WYSIWYGContext);
  if (!context) {
    return {
      isWYSIWYGMode: false,
      toggleWYSIWYG: () => {},
      activeField: null,
      setActiveField: () => {},
      editedValues: {},
      updateEditedValue: () => {},
      commitChange: () => {},
      cancelChange: () => {},
    };
  }
  return context;
}

interface WYSIWYGProviderProps {
  children: React.ReactNode;
  initialValues?: Partial<Record<EditableField, string>>;
  onCommit: (field: EditableField, value: string) => void;
}

export function WYSIWYGProvider({ children, initialValues = {}, onCommit }: WYSIWYGProviderProps) {
  const [isWYSIWYGMode, setIsWYSIWYGMode] = useState(false);
  const [activeField, setActiveField] = useState<EditableField | null>(null);
  const [editedValues, setEditedValues] = useState<Partial<Record<EditableField, string>>>(initialValues);

  const toggleWYSIWYG = useCallback(() => {
    setIsWYSIWYGMode(prev => !prev);
    setActiveField(null);
  }, []);

  const updateEditedValue = useCallback((field: EditableField, value: string) => {
    setEditedValues(prev => ({ ...prev, [field]: value }));
  }, []);

  const commitChange = useCallback((field: EditableField) => {
    const value = editedValues[field];
    if (value !== undefined) {
      onCommit(field, value);
    }
    setActiveField(null);
  }, [editedValues, onCommit]);

  const cancelChange = useCallback((field: EditableField) => {
    setEditedValues(prev => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setActiveField(null);
  }, []);

  return (
    <WYSIWYGContext.Provider value={{
      isWYSIWYGMode,
      toggleWYSIWYG,
      activeField,
      setActiveField,
      editedValues,
      updateEditedValue,
      commitChange,
      cancelChange,
    }}>
      {children}
    </WYSIWYGContext.Provider>
  );
}

interface EditableElementProps {
  field: EditableField;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  as?: keyof JSX.IntrinsicElements;
}

export function EditableElement({ field, children, className = '', style, as: Tag = 'div' }: EditableElementProps) {
  const { isWYSIWYGMode, activeField, setActiveField, editedValues, updateEditedValue, commitChange, cancelChange } = useWYSIWYG();
  const [localValue, setLocalValue] = useState('');
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const isActive = activeField === field;

  useEffect(() => {
    if (isActive && inputRef.current) {
      inputRef.current?.focus();
      if ('select' in inputRef.current) {
        (inputRef.current as HTMLInputElement).select();
      }
    }
  }, [isActive]);

  const handleClick = (e: React.MouseEvent) => {
    if (!isWYSIWYGMode) return;
    e.stopPropagation();
    setActiveField(field);
    const currentValue = editedValues[field] ?? (typeof children === 'string' ? children : '');
    setLocalValue(currentValue);
  };

  const handleBlur = () => {
    setTimeout(() => {
      if (document.activeElement?.closest?.('[data-editable]') === null) {
        commitChange(field);
      }
    }, 150);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      commitChange(field);
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      cancelChange(field);
    }
  };

  if (!isWYSIWYGMode) {
    return <Tag className={className} style={style}>{children}</Tag>;
  }

  const displayValue = editedValues[field] ?? (typeof children === 'string' ? children : '');

  return (
    <Tag
      className={`${className} relative cursor-pointer transition-all duration-200 ${isActive ? '' : 'hover:outline hover:outline-2 hover:outline-[#FF5C3A]/50 hover:outline-offset-2 rounded'}`}
      style={style}
      onClick={handleClick}
      data-editable={field}
      data-active={isActive}
    >
      {isActive ? (
        <div className="absolute inset-0 z-50" onClick={e => e.stopPropagation()}>
          {field === 'brand_description' ? (
            <textarea
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              value={localValue}
              onChange={e => {
                setLocalValue(e.target.value);
                updateEditedValue(field, e.target.value);
              }}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className="w-full h-full p-3 text-sm bg-white/95 backdrop-blur border-2 border-[#FF5C3A] rounded-lg shadow-xl resize-none"
              rows={3}
            />
          ) : (
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type="text"
              value={localValue}
              onChange={e => {
                setLocalValue(e.target.value);
                updateEditedValue(field, e.target.value);
              }}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className="w-full h-full px-3 text-sm bg-white/95 backdrop-blur border-2 border-[#FF5C3A] rounded-lg shadow-xl"
            />
          )}
        </div>
      ) : (
        <span className={`${!displayValue ? 'text-gray-300 italic' : ''}`}>{displayValue || 'Click para editar'}</span>
      )}
      
      {isWYSIWYGMode && !isActive && (
        <span className="absolute -top-2 -right-2 w-5 h-5 bg-[#FF5C3A] text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <EditIcon className="w-3 h-3" />
        </span>
      )}
    </Tag>
  );
}

function EditIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  );
}

interface WYSIWYGToolbarProps {
  className?: string;
}

export function WYSIWYGToolbar({ className = '' }: WYSIWYGToolbarProps) {
  const { isWYSIWYGMode, toggleWYSIWYG, activeField, commitChange, cancelChange } = useWYSIWYG();

  if (!isWYSIWYGMode) return null;

  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-6 py-3 bg-[#0a0a0a] border border-[#FF5C3A] rounded-2xl shadow-2xl shadow-black/50 ${className}`}>
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#FF5C3A] animate-pulse" />
        <span className="text-xs font-bold uppercase tracking-widest text-white">Modo Visual Activo</span>
      </div>
      
      {activeField && (
        <div className="flex items-center gap-2 pl-3 border-l border-white/20">
          <button
            onClick={() => commitChange(activeField)}
            className="px-3 py-1.5 bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-emerald-600 transition-colors"
          >
            Guardar
          </button>
          <button
            onClick={() => cancelChange(activeField)}
            className="px-3 py-1.5 bg-white/10 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-white/20 transition-colors"
          >
            Cancelar
          </button>
        </div>
      )}

      <button
        onClick={toggleWYSIWYG}
        className="ml-2 px-4 py-1.5 bg-[#FF5C3A] text-white text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-[#ff4736] transition-colors"
      >
        Salir
      </button>
    </div>
  );
}

interface WYSIWYGIndicatorProps {
  children: React.ReactNode;
  className?: string;
}

export function WYSIWYGIndicator({ children, className = '' }: WYSIWYGIndicatorProps) {
  const { isWYSIWYGMode } = useWYSIWYG();

  return (
    <div className={`relative ${isWYSIWYGMode ? 'ring-2 ring-[#FF5C3A]/30 ring-offset-2 rounded-lg' : ''} ${className}`}>
      {children}
      {isWYSIWYGMode && (
        <div className="absolute -top-3 -right-3 w-6 h-6 bg-[#FF5C3A] rounded-full flex items-center justify-center shadow-lg animate-in zoom-in duration-200">
          <EditIcon className="w-3 h-3 text-white" />
        </div>
      )}
    </div>
  );
}
