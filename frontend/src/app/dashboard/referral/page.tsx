'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Copy, Users, Gift, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com';

interface ReferralData {
  referralCode: string;
  referralCount: number;
  successfulReferrals: number;
  pendingReferrals: number;
  recentReferrals: Array<{
    id: string;
    referred_brand_id: string;
    status: string;
    created_at: string;
  }>;
}

export default function ReferralPage() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimCode, setClaimCode] = useState('');
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState<string | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);

  useEffect(() => {
    loadReferralData();
  }, []);

  const loadReferralData = async () => {
    try {
      const res = await fetch(`${API_URL}/api/brands/me/referral`, { credentials: 'include' });
      if (!res.ok) throw new Error('Error al cargar');
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError('Error al cargar datos de referidos');
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    if (data?.referralCode) {
      navigator.clipboard.writeText(data.referralCode);
    }
  };

  const handleClaim = async () => {
    if (!claimCode.trim()) return;
    setClaimLoading(true);
    setClaimError(null);
    setClaimSuccess(null);

    try {
      const res = await fetch(`${API_URL}/api/brands/me/referral/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code: claimCode }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error');
      setClaimSuccess(json.message);
      setClaimCode('');
    } catch (err: any) {
      setClaimError(err.message || 'Código inválido');
    } finally {
      setClaimLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF5C3A]" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Programa de Referidos</h1>
        <p className="text-[var(--text-muted)] mt-1">Invita a otras tiendas y gana meses gratis</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-[#FF5C3A]/10 rounded-lg">
              <Gift className="w-5 h-5 text-[#FF5C3A]" />
            </div>
            <span className="text-sm text-[var(--text-muted)]">Tu código</span>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <code className="text-2xl font-mono font-bold text-white">{data?.referralCode || '—'}</code>
            <button onClick={copyCode} className="p-2 hover:bg-[var(--bg-hover)] rounded-lg transition-colors" title="Copiar">
              <Copy className="w-4 h-4 text-[var(--text-muted)]" />
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <Users className="w-5 h-5 text-emerald-500" />
            </div>
            <span className="text-sm text-[var(--text-muted)]">Total referidos</span>
          </div>
          <p className="text-3xl font-bold text-white">{data?.referralCount || 0}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-amber-500" />
            </div>
            <span className="text-sm text-[var(--text-muted)]">Convertidos</span>
          </div>
          <p className="text-3xl font-bold text-white">{data?.successfulReferrals || 0}</p>
        </motion.div>
      </div>

      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">¿Cómo funciona?</h2>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-[#FF5C3A] text-white flex items-center justify-center font-bold text-sm flex-shrink-0">1</div>
            <div>
              <p className="text-white font-medium">Comparte tu código</p>
              <p className="text-sm text-[var(--text-muted)]">Envía tu código a otros dueños de tiendas de moda</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-[#FF5C3A] text-white flex items-center justify-center font-bold text-sm flex-shrink-0">2</div>
            <div>
              <p className="text-white font-medium">Ellos se registran</p>
              <p className="text-sm text-[var(--text-muted)]">Usan tu código al crear su cuenta</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-[#FF5C3A] text-white flex items-center justify-center font-bold text-sm flex-shrink-0">3</div>
            <div>
              <p className="text-white font-medium">Ambos ganan 1 mes gratis</p>
              <p className="text-sm text-[var(--text-muted)]">Cuando ellos convierten a plan pago</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">¿Tienes un código de referido?</h2>
        <p className="text-sm text-[var(--text-muted)] mb-4">Ingresa el código que te dio un amigo para obtener 1 mes gratis</p>
        
        {claimSuccess ? (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
            <p className="text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              {claimSuccess}
            </p>
          </div>
        ) : (
          <div className="flex gap-3">
            <input
              type="text"
              value={claimCode}
              onChange={(e) => setClaimCode(e.target.value.toUpperCase())}
              placeholder="Ej: ABC12345"
              className="flex-1 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-white placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#FF5C3A]"
            />
            <button
              onClick={handleClaim}
              disabled={claimLoading || !claimCode.trim()}
              className="px-6 py-3 bg-[#FF5C3A] text-white font-medium rounded-xl hover:bg-[#FF5C3A]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {claimLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Aplicar <ArrowRight className="w-4 h-4" /></>}
            </button>
          </div>
        )}
        {claimError && <p className="text-red-400 text-sm mt-2">{claimError}</p>}
      </div>

      {data?.recentReferrals && data.recentReferrals.length > 0 && (
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">Referidos Recientes</h2>
          <div className="space-y-3">
            {data.recentReferrals.map((ref) => (
              <div key={ref.id} className="flex items-center justify-between p-3 bg-[var(--bg-primary)] rounded-xl">
                <span className="text-sm text-[var(--text-muted)]">Referido #{ref.id.slice(0, 8)}</span>
                <span className={`text-sm font-medium ${ref.status === 'converted' ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {ref.status === 'converted' ? 'Convertido' : 'Pendiente'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}