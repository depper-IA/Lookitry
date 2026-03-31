'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, CreditCard, Clock, CheckCircle, AlertTriangle, XCircle, Zap } from 'lucide-react';
import type { SubscriptionInfo } from '@/services/subscription.service';
import { formatCurrency } from '@/utils/currency';
import { fetchPublicPaymentSettings, fetchPublicPlanPrices } from '@/services/public-config.service';
import { getSubscriptionDisplayState } from '@/lib/subscription-display';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscriptionInfo: SubscriptionInfo;
}

export function SubscriptionModal({ isOpen, onClose, subscriptionInfo }: SubscriptionModalProps) {
  const [planPrices, setPlanPrices] = useState({ BASIC: 150000, PRO: 250000 });
  const [supportEmail, setSupportEmail] = useState('info@lookitry.com');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    fetchPublicPlanPrices().then(setPlanPrices).catch(() => {});
    fetchPublicPaymentSettings()
      .then((data) => {
        if (data?.manualEmail) setSupportEmail(data.manualEmail);
      })
      .catch(() => {});
  }, [isOpen]);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!isOpen || !mounted) return null;

  const { brand, daysRemaining, status, isInTrial, trialDaysRemaining, trialEndDate } = subscriptionInfo;
  const displayState = getSubscriptionDisplayState(brand);
  const showTrialState = isInTrial || displayState.isTrial || displayState.displayPlan === 'TRIAL';

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusConfig = () => {
    if (showTrialState) {
      return { label: 'Período trial', color: '#FF5C3A', bg: 'rgba(255,92,58,0.12)', Icon: Clock };
    }

    switch (status) {
      case 'active':
        return { label: 'Activa', color: '#10b981', bg: 'rgba(16,185,129,0.1)', Icon: CheckCircle };
      case 'expiring_soon':
        return { label: 'Por vencer', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', Icon: AlertTriangle };
      case 'expired':
        return { label: 'Vencida', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', Icon: XCircle };
      case 'suspended':
        return { label: 'Suspendida', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', Icon: XCircle };
      default:
        return { label: 'Sin plan', color: '#999', bg: 'rgba(153,153,153,0.1)', Icon: Clock };
    }
  };

  const statusCfg = getStatusConfig();
  const StatusIcon = statusCfg.Icon;
  const rows: { label: string; value: React.ReactNode; icon: React.ElementType }[] = [];

  if (showTrialState && (trialEndDate || displayState.renewalDate)) {
    rows.push({ label: 'Fin del trial', value: formatDate(trialEndDate ?? displayState.renewalDate), icon: Calendar });
  }

  if (!showTrialState) {
    rows.push({
      label: 'Días restantes',
      value: `${daysRemaining} ${daysRemaining === 1 ? 'día' : 'días'}`,
      icon: Clock,
    });
    rows.push({
      label: 'Precio',
      value: formatCurrency(planPrices[brand.plan as 'BASIC' | 'PRO'] ?? 0),
      icon: CreditCard,
    });
    rows.push({ label: 'Inicio', value: formatDate(brand.subscriptionStartDate), icon: Calendar });
    rows.push({ label: 'Vencimiento', value: formatDate(brand.subscriptionEndDate), icon: Calendar });
    if (brand.lastPaymentDate) {
      rows.push({ label: 'Último pago', value: formatDate(brand.lastPaymentDate), icon: CreditCard });
    }
  }

  const showWarning = !showTrialState && (status === 'expiring_soon' || status === 'expired' || status === 'suspended');
  const warningMsg =
    status === 'suspended' || status === 'expired'
      ? 'Tu suscripción requiere atención. Contáctanos para renovarla.'
      : 'Tu suscripción está por vencer. Renueva pronto para evitar interrupciones.';

  const modalContent = (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 backdrop-blur-sm"
      style={{ background: 'rgba(0,0,0,0.62)' }}
      onClick={onClose}
    >
      <div
        className="relative isolate w-full max-w-lg overflow-hidden rounded-[28px]"
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.32)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="max-h-[85vh] overflow-y-auto">
          <div
            className="flex items-start justify-between gap-4 px-6 py-5"
            style={{ borderBottom: '1px solid var(--border-color)' }}
          >
            <div className="flex min-w-0 items-center gap-3">
              <div
                className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl"
                style={{ background: 'rgba(255,92,58,0.12)' }}
              >
                <Zap className="h-5 w-5 text-[#FF5C3A]" />
              </div>
              <div className="min-w-0">
                <h2 className="font-jakarta text-lg font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
                  {showTrialState ? 'Período trial' : 'Tu suscripción'}
                </h2>
                <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                  Plan {showTrialState ? 'TRIAL' : brand.plan}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full transition-colors cursor-pointer"
              style={{ background: 'var(--bg-hover)' }}
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
            </button>
          </div>

          <div className="px-6 py-5">
            <div
              className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold"
              style={{ background: statusCfg.bg, color: statusCfg.color }}
            >
              <StatusIcon className="h-3.5 w-3.5" />
              {statusCfg.label}
            </div>

            {showTrialState && (
              <div
                className="mt-4 rounded-2xl p-4 text-sm leading-relaxed"
                style={{
                  background: 'rgba(255,92,58,0.08)',
                  color: '#FF5C3A',
                  border: '1px solid rgba(255,92,58,0.2)',
                }}
              >
                <strong>{trialDaysRemaining ?? displayState.daysUntilTrialEnd ?? 0} {(trialDaysRemaining ?? displayState.daysUntilTrialEnd ?? 0) === 1 ? 'día' : 'días'} restantes</strong> en tu período trial.
                {' '}Activa un plan para continuar sin interrupciones.
              </div>
            )}

            <div className="mt-5 space-y-2">
              {rows.map(({ label, value, icon: Icon }, i) => (
                <div
                  key={label}
                  className="grid grid-cols-1 gap-3 py-3 md:grid-cols-[180px_minmax(0,1fr)] md:items-center"
                  style={{ borderBottom: i < rows.length - 1 ? '1px solid var(--border-color)' : 'none' }}
                >
                  <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <Icon className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                    <span>{label}</span>
                  </div>
                  <div className="min-w-0 text-left text-sm font-semibold leading-relaxed md:text-right" style={{ color: 'var(--text-primary)' }}>
                    <span className="block break-words">{value}</span>
                  </div>
                </div>
              ))}
            </div>

            {showWarning && (
              <div
                className="mt-5 flex items-start gap-3 rounded-2xl p-4 text-sm leading-relaxed"
                style={{
                  background: 'rgba(245,158,11,0.08)',
                  color: '#f59e0b',
                  border: '1px solid rgba(245,158,11,0.2)',
                }}
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span className="break-words">
                  {warningMsg} <strong>{supportEmail}</strong>
                </span>
              </div>
            )}
          </div>

          <div
            className="px-6 pb-6 pt-4"
            style={{ borderTop: '1px solid var(--border-color)' }}
          >
            <button
              onClick={onClose}
              className="w-full rounded-2xl py-3 text-sm font-semibold transition-opacity cursor-pointer"
              style={{ background: '#FF5C3A', color: '#fff' }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.88')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
