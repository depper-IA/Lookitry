'use client';

import type { Brand, UsageStats } from '@/types';
import type { BrandAnalytics } from '@/services/analytics.service';
import type { SubscriptionInfo } from '@/services/subscription.service';

export type WooMetricsSummary = {
  products?: {
    totalMappedProducts?: number;
    activeMappedProducts?: number;
  };
  telemetry?: {
    totalRequests?: number;
    failedRequests?: number;
    avgLatencyMs?: number;
    lastSyncAt?: string | null;
  };
  integration?: {
    pluginValidated?: boolean;
    pluginValidatedAt?: string | null;
    pluginStoreDomain?: string | null;
  };
} | null;

type ChecklistItem = {
  id: string;
  title: string;
  description: string;
  href: string;
  done: boolean;
  stateLabel: string;
};

type NextAction = {
  title: string;
  description: string;
  href: string;
  cta: string;
};

export interface DashboardAccountState {
  progressPercent: number;
  completedSteps: number;
  totalSteps: number;
  isActivationFocused: boolean;
  statusTitle: string;
  statusDescription: string;
  nextAction: NextAction;
  checklist: ChecklistItem[];
  systemChecks: Array<{
    id: string;
    label: string;
    value: string;
    tone: 'ok' | 'warn' | 'muted';
  }>;
}

function getAllowedOriginsCount(brand: Brand | null): number {
  const allowedOrigins = brand?.socialLinks?.allowed_origins;
  return Array.isArray(allowedOrigins) ? allowedOrigins.filter(Boolean).length : 0;
}

function hasConfiguredApiKey(brand: Brand | null): boolean {
  const apiKey = brand?.apiKey ?? (brand as Brand & { api_key?: string | null } | null)?.api_key;
  return Boolean(apiKey && !String(apiKey).includes('•'));
}

function isPaidPlanActive(subscriptionInfo: SubscriptionInfo | null): boolean {
  if (!subscriptionInfo) return false;
  if (subscriptionInfo.isInTrial) return false;
  return subscriptionInfo.status === 'active' || subscriptionInfo.status === 'expiring_soon';
}

export function deriveDashboardAccountState(params: {
  brand: Brand | null;
  usage: UsageStats | null;
  analytics: BrandAnalytics | null;
  subscriptionInfo: SubscriptionInfo | null;
  wooMetrics: WooMetricsSummary;
}): DashboardAccountState {
  const { brand, usage, analytics, subscriptionInfo, wooMetrics } = params;

  const isTrial = subscriptionInfo?.isInTrial ?? brand?.plan === 'TRIAL';
  const hasActivePlan = isTrial || isPaidPlanActive(subscriptionInfo);
  const emailVerified = Boolean(brand?.emailVerified);
  const hasProducts = (usage?.currentMonth?.productsCount ?? 0) > 0;
  const hasTryOns = (analytics?.totalGenerations ?? 0) > 0;
  const pluginValidated = Boolean(wooMetrics?.integration?.pluginValidated);
  const hasApiKey = hasConfiguredApiKey(brand);
  const allowedOriginsCount = getAllowedOriginsCount(brand);
  const hasDomain = Boolean(brand?.customDomain || brand?.website);
  const storeConnected = Boolean(pluginValidated || wooMetrics?.integration?.pluginStoreDomain || allowedOriginsCount > 0 || hasDomain);
  const widgetInstalled = Boolean(pluginValidated || hasApiKey);

  const checklist: ChecklistItem[] = [
    {
      id: 'account',
      title: 'Cuenta creada',
      description: emailVerified ? 'Tu acceso ya está validado y listo para operar.' : 'Aún debes confirmar tu correo para dejar la cuenta totalmente validada.',
      href: '/dashboard/profile',
      done: emailVerified,
      stateLabel: emailVerified ? 'Lista' : 'Validación pendiente',
    },
    {
      id: 'plan',
      title: isTrial ? 'Trial activo' : 'Plan activo',
      description: hasActivePlan
        ? (isTrial ? 'Tu periodo de prueba sigue habilitado para terminar configuración.' : 'Tu suscripción ya permite operar sin volver al checkout.')
        : 'Todavía no hay una suscripción activa para continuar.',
      href: '/dashboard/subscription',
      done: hasActivePlan,
      stateLabel: hasActivePlan ? (isTrial ? 'Trial habilitado' : 'Pago confirmado') : 'Pendiente de activación',
    },
    {
      id: 'store',
      title: 'Tienda conectada',
      description: storeConnected
        ? 'Detectamos una señal de dominio, tienda o conector vinculado.'
        : 'Todavía no vemos una tienda enlazada o un dominio configurado.',
      href: '/dashboard/integrations',
      done: storeConnected,
      stateLabel: storeConnected ? 'Conectada' : 'Sin conectar',
    },
    {
      id: 'widget',
      title: 'Widget instalado',
      description: widgetInstalled
        ? (pluginValidated ? 'El plugin ya fue validado por Lookitry.' : 'La API está configurada, pero aún falta validar la instalación final.')
        : 'Falta instalar o configurar el widget en tu tienda.',
      href: '/dashboard/integrations',
      done: widgetInstalled,
      stateLabel: pluginValidated ? 'Operativo' : widgetInstalled ? 'Configuración en curso' : 'No instalado',
    },
    {
      id: 'product',
      title: 'Primer producto listo',
      description: hasProducts
        ? 'Ya tienes catálogo cargado para empezar a recibir pruebas.'
        : 'Debes cargar al menos un producto para que el probador tenga contenido.',
      href: '/dashboard/products',
      done: hasProducts,
      stateLabel: hasProducts ? 'Cargado' : 'Pendiente',
    },
    {
      id: 'tryons',
      title: 'Primeras pruebas recibidas',
      description: hasTryOns
        ? 'Tu cuenta ya empezó a recibir interacción real o pruebas internas.'
        : 'Aún no hay pruebas registradas. Comparte el probador para activarlo.',
      href: '/dashboard/integrations',
      done: hasTryOns,
      stateLabel: hasTryOns ? 'En marcha' : 'Sin actividad',
    },
  ];

  const completedSteps = checklist.filter((item) => item.done).length;
  const totalSteps = checklist.length;
  const progressPercent = Math.round((completedSteps / totalSteps) * 100);

  let nextAction: NextAction = {
    title: 'Cuenta en funcionamiento',
    description: 'Tu configuración base ya está resuelta. Ahora conviene revisar rendimiento y optimizar productos.',
    href: '/dashboard/analytics',
    cta: 'Ver resultados',
  };

  if (!emailVerified) {
    nextAction = {
      title: 'Confirma tu acceso',
      description: 'Verifica tu correo para evitar bloqueos de recuperación, alertas y facturación.',
      href: '/dashboard/profile',
      cta: 'Revisar perfil',
    };
  } else if (!hasActivePlan) {
    nextAction = {
      title: 'Activa tu plan',
      description: 'El siguiente paso del flujo es dejar la suscripción activa para continuar la implementación.',
      href: '/dashboard/subscription',
      cta: 'Ir a suscripción',
    };
  } else if (!storeConnected || !widgetInstalled) {
    nextAction = {
      title: 'Conecta tu tienda',
      description: 'Ya pagaste o activaste tu cuenta. Lo que falta ahora es enlazar la tienda e instalar el widget.',
      href: '/dashboard/integrations',
      cta: 'Conectar tienda',
    };
  } else if (!hasProducts) {
    nextAction = {
      title: 'Carga tu primer producto',
      description: 'Sin catálogo, el probador no puede operar para tus clientes.',
      href: '/dashboard/products',
      cta: 'Agregar producto',
    };
  } else if (!hasTryOns) {
    nextAction = {
      title: 'Lanza tu probador',
      description: 'Comparte el enlace o instala el widget en producción para empezar a recibir pruebas reales.',
      href: '/dashboard/integrations',
      cta: 'Compartir probador',
    };
  }

  const statusTitle = completedSteps <= 2
    ? 'Tu cuenta está en activación'
    : completedSteps < totalSteps
      ? 'Ya estás cerca de operar'
      : 'Tu cuenta está operativa';

  const statusDescription = completedSteps <= 2
    ? 'Primero necesitas cerrar la activación comercial y técnica para que el cliente entienda claramente que ya puede usar Lookitry.'
    : completedSteps < totalSteps
      ? 'La parte crítica ya existe. Falta terminar instalación, contenido o lanzamiento para que el flujo quede completo.'
      : 'El flujo de registro, pago y acceso ya tiene continuidad hasta el dashboard. Ahora la prioridad es rendimiento y crecimiento.';

  const systemChecks: DashboardAccountState['systemChecks'] = [
    {
      id: 'plan',
      label: 'Estado comercial',
      value: hasActivePlan ? (isTrial ? 'Trial activo' : 'Suscripción activa') : 'Requiere activación',
      tone: hasActivePlan ? 'ok' : 'warn',
    },
    {
      id: 'email',
      label: 'Cuenta',
      value: emailVerified ? 'Correo validado' : 'Verificación pendiente',
      tone: emailVerified ? 'ok' : 'warn',
    },
    {
      id: 'integration',
      label: 'Integración',
      value: pluginValidated
        ? 'Plugin validado'
        : widgetInstalled
          ? 'API configurada'
          : 'Sin instalación detectada',
      tone: pluginValidated ? 'ok' : widgetInstalled ? 'warn' : 'muted',
    },
    {
      id: 'catalog',
      label: 'Catálogo',
      value: `${usage?.currentMonth?.productsCount ?? 0} producto${(usage?.currentMonth?.productsCount ?? 0) === 1 ? '' : 's'} cargados`,
      tone: hasProducts ? 'ok' : 'warn',
    },
    {
      id: 'activity',
      label: 'Actividad',
      value: hasTryOns
        ? `${analytics?.totalGenerations ?? 0} pruebas registradas`
        : 'Sin pruebas todavía',
      tone: hasTryOns ? 'ok' : 'muted',
    },
    {
      id: 'sync',
      label: 'Última sincronización',
      value: wooMetrics?.telemetry?.lastSyncAt
        ? new Date(wooMetrics.telemetry.lastSyncAt).toLocaleString('es-CO')
        : 'Sin sincronización detectada',
      tone: wooMetrics?.telemetry?.lastSyncAt ? 'ok' : 'muted',
    },
  ];

  return {
    progressPercent,
    completedSteps,
    totalSteps,
    isActivationFocused: !hasTryOns || !hasProducts || !storeConnected || !widgetInstalled,
    statusTitle,
    statusDescription,
    nextAction,
    checklist,
    systemChecks,
  };
}
