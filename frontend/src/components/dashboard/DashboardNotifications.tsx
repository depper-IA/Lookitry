'use client';

import React, { useState, useEffect } from 'react';
import { usageService } from '@/services/usage.service';
import { useSubscription } from '@/hooks/useSubscription';
import type { UsageStats } from '@/types';

// Genera la clave de sessionStorage para el mes actual
function getSessionKey(type: 'usage_80' | 'usage_100' | 'subscription_expiring'): string {
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  return `notif_${type}_${monthKey}`;
}

function isDismissed(key: string): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(key) === 'dismissed';
}

function dismiss(key: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(key, 'dismissed');
}

// Icono de alerta triangular
function AlertTriangleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  );
}

// Icono de cierre X
function XIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}

// Icono de reloj para suscripción
function ClockIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

export function DashboardNotifications() {
  const { subscriptionInfo, getDaysRemaining, isInTrial } = useSubscription();
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);

  // Estado de visibilidad de cada notificación (inicializado desde sessionStorage)
  const [showUsage80, setShowUsage80] = useState(false);
  const [showUsage100, setShowUsage100] = useState(false);
  const [showSubscriptionExpiring, setShowSubscriptionExpiring] = useState(false);

  // Cargar estadísticas de uso
  useEffect(() => {
    usageService.getUsageStats()
      .then((stats) => setUsageStats(stats))
      .catch(() => {
        // Silenciar error — las notificaciones simplemente no se muestran
      });
  }, []);

  // Determinar visibilidad de banners de uso cuando llegan los datos
  useEffect(() => {
    if (!usageStats) return;

    const pct = usageStats.percentageUsed;

    // Banner rojo: 100% o más
    if (pct >= 100 && !isDismissed(getSessionKey('usage_100'))) {
      setShowUsage100(true);
    }

    // Banner amarillo: entre 80% y 99%
    if (pct >= 80 && pct < 100 && !isDismissed(getSessionKey('usage_80'))) {
      setShowUsage80(true);
    }
  }, [usageStats]);

  // Determinar visibilidad del badge de suscripción
  useEffect(() => {
    if (!subscriptionInfo) return;

    const inTrial = isInTrial();
    // No mostrar banner de suscripción si está en período de prueba o sin suscripción pagada
    if (inTrial) return;
    if (!subscriptionInfo.status) return; // sin suscripción pagada aún

    const days = getDaysRemaining();
    if (days !== null && days < 7 && !isDismissed(getSessionKey('subscription_expiring'))) {
      setShowSubscriptionExpiring(true);
    }
  }, [subscriptionInfo]);

  const handleDismissUsage80 = () => {
    dismiss(getSessionKey('usage_80'));
    setShowUsage80(false);
  };

  const handleDismissUsage100 = () => {
    dismiss(getSessionKey('usage_100'));
    setShowUsage100(false);
  };

  const handleDismissSubscription = () => {
    dismiss(getSessionKey('subscription_expiring'));
    setShowSubscriptionExpiring(false);
  };

  // Si no hay nada que mostrar, no renderizar nada
  if (!showUsage100 && !showUsage80 && !showSubscriptionExpiring) {
    return null;
  }

  const daysRemaining = getDaysRemaining();

  return (
    <div className="space-y-2 mb-6" role="region" aria-label="Notificaciones del dashboard">

      {/* Banner rojo: límite de generaciones alcanzado (100%) */}
      {showUsage100 && (
        <div
          className="flex items-start justify-between gap-3 px-4 py-3 bg-red-50 border border-red-300 rounded-lg"
          role="alert"
        >
          <div className="flex items-start gap-3">
            <AlertTriangleIcon className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-800">
                Límite de generaciones alcanzado
              </p>
              <p className="text-sm text-red-700 mt-0.5">
                Has usado el 100% de tus generaciones este mes (
                {usageStats?.currentMonth.generationsUsed}/
                {usageStats?.currentMonth.generationsLimit}). No podrás generar
                nuevas imágenes hasta el{' '}
                {usageStats?.resetDate
                  ? new Date(usageStats.resetDate).toLocaleDateString('es-CO', {
                      day: 'numeric',
                      month: 'long',
                    })
                  : 'próximo mes'}
                .
              </p>
            </div>
          </div>
          <button
            onClick={handleDismissUsage100}
            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-100 rounded transition-colors shrink-0"
            aria-label="Cerrar notificación de límite alcanzado"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Banner amarillo: 80% de generaciones usadas */}
      {showUsage80 && (
        <div
          className="flex items-start justify-between gap-3 px-4 py-3 bg-yellow-50 border border-yellow-300 rounded-lg"
          role="alert"
        >
          <div className="flex items-start gap-3">
            <AlertTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-yellow-800">
                Acercándote al límite de generaciones
              </p>
              <p className="text-sm text-yellow-700 mt-0.5">
                Has usado el {Math.round(usageStats?.percentageUsed ?? 0)}% de tus
                generaciones este mes ({usageStats?.currentMonth.generationsUsed}/
                {usageStats?.currentMonth.generationsLimit}). Considera actualizar
                tu plan si necesitas más capacidad.
              </p>
            </div>
          </div>
          <button
            onClick={handleDismissUsage80}
            className="p-1 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100 rounded transition-colors shrink-0"
            aria-label="Cerrar notificación de uso al 80%"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Banner de suscripción por vencer (< 7 días) */}
      {showSubscriptionExpiring && (
        <div
          className="flex items-start justify-between gap-3 px-4 py-3 bg-yellow-50 border border-yellow-300 rounded-lg"
          role="alert"
        >
          <div className="flex items-start gap-3">
            <ClockIcon className="h-5 w-5 text-yellow-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-yellow-800">
                Suscripción por vencer
              </p>
              <p className="text-sm text-yellow-700 mt-0.5">
                Tu suscripción vence en{' '}
                <span className="font-semibold">
                  {daysRemaining} {daysRemaining === 1 ? 'día' : 'días'}
                </span>
                . Renueva para mantener el acceso sin interrupciones.{' '}
                <a
                  href="/dashboard/subscription"
                  className="underline font-medium hover:text-yellow-900"
                >
                  Ver detalles
                </a>
              </p>
            </div>
          </div>
          <button
            onClick={handleDismissSubscription}
            className="p-1 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100 rounded transition-colors shrink-0"
            aria-label="Cerrar notificación de suscripción"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
