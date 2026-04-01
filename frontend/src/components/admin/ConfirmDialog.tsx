'use client';

import { useState, createContext, useContext, ReactNode } from 'react';
import { AlertTriangle, Shield, X } from 'lucide-react';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  reason?: string;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConfirmOptions & { resolve: (value: boolean) => void; open: boolean }>({
    title: '', message: '', confirmLabel: 'Confirmar', cancelLabel: 'Cancelar', danger: false, reason: '', resolve: () => {}, open: false,
  });

  const confirm = (options: ConfirmOptions): Promise<boolean> => {
    return new Promise(resolve => {
      setState({ ...options, resolve, open: true });
    });
  };

  const handleConfirm = () => {
    setState(prev => ({ ...prev, open: false }));
    state.resolve(true);
  };

  const handleCancel = () => {
    setState(prev => ({ ...prev, open: false }));
    state.resolve(false);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {state.open && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 animate-in fade-in">
          <div className="rounded-[2rem] p-6 max-w-md w-full animate-in zoom-in-95" style={{ backgroundColor: 'var(--bg-card)', border: `1px solid ${state.danger ? 'rgba(239,68,68,0.3)' : 'var(--border-color)'}` }}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: state.danger ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)', color: state.danger ? '#ef4444' : '#f59e0b' }}>
                  {state.danger ? <Shield className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                </div>
                <h3 className="font-jakarta font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{state.title}</h3>
              </div>
              <button onClick={handleCancel} className="p-1 rounded-lg hover:bg-white/5 transition-colors" style={{ color: 'var(--text-muted)' }}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>{state.message}</p>
            {state.reason && (
              <div className="px-3 py-2 rounded-lg mb-4" style={{ backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                <p className="text-xs" style={{ color: '#f59e0b' }}>
                  <strong>Motivo:</strong> {state.reason}
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={handleCancel}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                style={{ backgroundColor: 'var(--bg-base)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                {state.cancelLabel}
              </button>
              <button onClick={handleConfirm}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${state.danger ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-[#FF5C3A] hover:bg-[#e04e30] text-white'}`}>
                {state.confirmLabel || 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider');
  return ctx.confirm;
}
