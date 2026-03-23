'use client';

import React from 'react';
import { X, Calendar, CreditCard, Clock, CheckCircle, AlertTriangle, XCircle, Zap } from 'lucide-react';
import type { SubscriptionInfo } from '@/services/subscription.service';
import { formatPlanPrice } from '@/utils/currency';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscriptionInfo: SubscriptionInfo;
}

export function SubscriptionModal({ isOpen, onClose, subscriptionInfo }: SubscriptionModalProps) {
  if (!isOpen) return null;

  const { brand, daysRemaining, status, isInTrial, trialDaysRemaining, trialEndDate } = subscriptionInfo;

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  };

  const getStatusConfig = () => {
    if (isInTrial) return { label: 'Período de prueba', color: '#6366f1', bg: 'rgba(99,102,241,0.1)', Icon: Clock };
    switch (status) {
      case 'active':        return { label: 'Activa',      color: '#10b981', bg: 'rgba(16,185,129,0.1)',  Icon: CheckCircle };
      case 'expiring_soon': return { label: 'Por vencer',  color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', Icon: AlertTriangle };
      case 'expired':       return { label: 'Vencida',     color: '#ef4444', bg: 'rgba(239,68,68,0.1)',  Icon: XCircle };
      case 'suspended':     return { label: 'Suspendida',  color: '#ef4444', bg: 'rgba(239,68,68,0.1)',  Icon: XCircle };
      default:              return { label: 'Sin plan',    color: '#999',    bg: 'rgba(153,153,153,0.1)', Icon: Clock };
    }
  };

  const statusCfg = getStatusConfig();
  const StatusIcon = statusCfg.Icon;

  const rows: { label: string; value: React.ReactNode; icon: React.ElementType }[] = [];

  if (isInTrial && trialEndDate) {
    rows.push({ label: 'Fin del trial', value: formatDate(trialEndDate), icon: Calendar });
  }
  if (!isInTrial) {
    rows.push({ label: 'Días restantes', value: `${daysRemaining} ${daysRemaining === 1 ? 'día' : 'días'}`, icon: Clock });
    rows.push({ label: 'Precio', value: formatPlanPrice(brand.plan), icon: CreditCard });
    rows.push({ label: 'Inicio', value: formatDate(brand.subscriptionStartDate), icon: Calendar });
    rows.push({ label: 'Vencimiento', value: formatDate(brand.subscriptionEndDate), icon: Calendar });
    if (brand.lastPaymentDate) {
      rows.push({ label: 'Último pago', value: formatDate(brand.lastPaymentDate), icon: CreditCard });
    }
  }

  const showWarning = !isInTrial && (status === 'expiring_soon' || status === 'expired' || status === 'suspended');
  const warningMsg = status === 'suspended' || status === 'expired'
    ? 'Tu suscripción requiere atención. Contáctanos para renovar.'
    : 'Tu suscripción está por vencer. Renueva pronto para evitar interrupciones.';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: 'var(--bg-card)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-5 py-4 flex items-center justify-between"
          style={{ borderBottom: '1px solid var(--border-color)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(255,92,58,0.1)' }}
            >
              <Zap className="w-4.5 h-4.5 text-[#FF5C3A]" />
            </div>
            <div>
              <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                {isInTrial ? 'Período de Prueba' : 'Tu Suscripción'}
              </h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Plan {brand.plan}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center transition-colors cursor-pointer"
            style={{ background: 'var(--bg-hover)' }}
            aria-label="Cerrar"
          >
            <X className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>

        {/* Status pill */}
        <div className="px-5 pt-4">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ background: statusCfg.bg, color: statusCfg.color }}
          >
            <StatusIcon className="w-3.5 h-3.5" />
            {statusCfg.label}
          </div>
        </div>

        {/* Trial info */}
        {isInTrial && (
          <div
            className="mx-5 mt-3 p-3 rounded-xl text-xs"
            style={{ background: 'rgba(99,102,241,0.08)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.2)' }}
          >
            <strong>{trialDaysRemaining} {trialDaysRemaining === 1 ? 'día' : 'días'} restantes</strong> en tu período de prueba.
            Activa un plan para continuar sin interrupciones.
          </div>
        )}

        {/* Rows */}
        <div className="px-5 py-4 space-y-0">
          {rows.map(({ label, value, icon: Icon }, i) => (
            <div
              key={label}
              className="flex items-center justify-between py-3"
              style={{ borderBottom: i < rows.length - 1 ? '1px solid var(--border-color)' : 'none' }}
            >
              <div className="flex items-center gap-2">
                <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{label}</span>
              </div>
              <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Warning */}
        {showWarning && (
          <div
            className="mx-5 mb-4 p-3 rounded-xl text-xs flex items-start gap-2"
            style={{ background: 'rgba(245,158,11,0.08)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }}
          >
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>{warningMsg} <strong>soporte@lookitry.com</strong></span>
          </div>
        )}

        {/* Footer */}
        <div
          className="px-5 pb-5"
          style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}
        >
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-sm font-semibold transition-opacity cursor-pointer"
            style={{ background: '#FF5C3A', color: '#fff' }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
