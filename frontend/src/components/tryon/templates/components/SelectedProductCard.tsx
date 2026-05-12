'use client';

import { motion } from 'framer-motion';
import type { Product } from '../types';

interface SelectedProductCardProps {
  selectedProduct: Product;
  onProceedToUpload?: () => void;
  primaryColor: string;
  primaryGlow: string;
  primarySubtle: string;
  mainTextPrimary: string;
  mainTextMuted: string;
  buttonText?: string;
}

export function SelectedProductCard({
  selectedProduct,
  onProceedToUpload,
  primaryColor,
  primaryGlow,
  primarySubtle,
  mainTextPrimary,
  mainTextMuted,
  buttonText,
}: SelectedProductCardProps) {
  return (
    <div 
      className="relative p-5 rounded-2xl shadow-xl overflow-hidden"
      style={{ 
        background: `linear-gradient(135deg, ${primarySubtle} 0%, ${primarySubtle} 100%)`,
        border: `1px solid ${primaryColor}30`,
        boxShadow: `0 20px 60px ${primaryGlow}`,
      }}
    >
      {/* Glow effect */}
      <div 
        className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-2xl opacity-20"
        style={{ backgroundColor: primaryColor }}
      />
      
      <div className="relative flex items-center gap-5">
        <div className="relative">
          <img 
            src={selectedProduct.imageUrl} 
            alt={selectedProduct.name} 
            className="w-20 h-20 rounded-2xl object-cover shadow-xl" 
          />
          <div 
            className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center shadow-md"
            style={{ backgroundColor: primaryColor }}
          >
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        
        <div className="flex-1">
          <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: primaryColor }}>Producto seleccionado</p>
          <h3 className="text-lg font-black italic tracking-tight" style={{ color: mainTextPrimary }}>{selectedProduct.name}</h3>
          {selectedProduct.category && (
            <p className="text-xs font-medium mt-1" style={{ color: mainTextMuted }}>{selectedProduct.category}</p>
          )}
        </div>
        
        <motion.button
          onClick={onProceedToUpload}
          whileTap={{ scale: 0.97 }}
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="px-5 py-3 rounded-xl font-black uppercase tracking-[0.1em] text-xs text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 relative overflow-hidden group"
          style={{ 
            backgroundColor: primaryColor,
            boxShadow: `0 8px 30px ${primaryGlow}`
          }}
        >
          <motion.div 
            className="absolute inset-0 bg-white/20"
            initial={{ y: "100%" }}
            whileHover={{ y: "0%" }}
            transition={{ duration: 0.3 }}
          />
          <span className="relative z-10">{buttonText || 'Siguiente'}</span>
          <motion.svg 
            className="w-4 h-4 relative z-10" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor" 
            strokeWidth={2.5}
            whileHover={{ x: 4 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </motion.svg>
        </motion.button>
      </div>
    </div>
  );
}

interface EmptyStateProps {
  primaryColor: string;
  primarySubtle: string;
  mainTextPrimary: string;
  mainTextMuted: string;
}

export function DesktopEmptyState({ primaryColor, primarySubtle, mainTextPrimary, mainTextMuted }: EmptyStateProps) {
  return (
    <div 
      className="p-8 text-center rounded-2xl border-2 border-dashed"
      style={{ borderColor: `${primaryColor}30`, backgroundColor: `${primarySubtle}` }}
    >
      <div className="w-16 h-16 mx-auto rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: `${primaryColor}10` }}>
        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: primaryColor }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      </div>
      <h3 className="text-base font-bold mb-1.5" style={{ color: mainTextPrimary }}>Selecciona un producto</h3>
      <p className="text-xs font-medium" style={{ color: mainTextMuted }}>Toca cualquier producto en el panel izquierdo para comenzar</p>
    </div>
  );
}
