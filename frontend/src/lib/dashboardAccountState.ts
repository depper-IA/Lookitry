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

  // Integración WooCommerce es exclusiva del Plan PRO
  const isPro = String(brand?.plan || '').toUpperCase() === 'PRO';
  // Solo mostrar pasos de tienda/widget si el usuario es PRO, o si ya tiene una conexión validada real
  const showIntegrationSteps = isPro || pluginValidated;

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
    ...(showIntegrationSteps ? [
      {
        id: 'store',
        title: 'Tienda conectada',
        description: storeConnected
          ? 'Tu tienda o dominio ya estan vinculados para seguir con la activacion.'
          : 'Aun falta enlazar tu tienda o configurar el dominio donde vivira el probador.',
        href: '/dashboard/integrations',
        done: storeConnected,
        stateLabel: storeConnected ? 'Conectada' : 'Sin conectar',
      },
      {
        id: 'widget',
        title: 'Widget instalado',
        description: widgetInstalled
          ? (pluginValidated ? 'Tu probador ya quedo listo para instalarse o usarse en tienda.' : 'La conexion ya empezo, pero todavia falta terminar la instalacion.')
          : 'Todavia falta instalar o configurar el probador en tu tienda.',
        href: '/dashboard/integrations',
        done: widgetInstalled,
        stateLabel: pluginValidated ? 'Operativo' : widgetInstalled ? 'Configuración en curso' : 'No instalado',
      },
    ] as typeof checklist : []),
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
        ? 'Tu cuenta ya empezo a recibir actividad y pruebas del probador.'
        : 'Todavia no hay pruebas registradas. Comparte el probador para ponerlo en marcha.',
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
    description: 'Tu cuenta ya quedo lista en lo esencial. Ahora conviene revisar resultados y mejorar productos.',
    href: '/dashboard/analytics',
    cta: 'Ver resultados',
  };

  if (!emailVerified) {
    nextAction = {
      title: 'Confirma tu acceso',
      description: 'Confirma tu correo para dejar la cuenta lista y evitar bloqueos de acceso o avisos.',
      href: '/dashboard/profile',
      cta: 'Revisar perfil',
    };
  } else if (!hasActivePlan) {
    nextAction = {
      title: 'Activa tu plan',
      description: 'Activa tu plan para poder terminar la configuracion y empezar a operar sin fricciones.',
      href: '/dashboard/subscription',
      cta: 'Ir a suscripción',
    };
  } else if (showIntegrationSteps && (!storeConnected || !widgetInstalled)) {
    nextAction = {
      title: 'Conecta tu tienda',
      description: 'Tu cuenta ya avanzo. Lo que falta ahora es conectar la tienda y dejar el probador publicado.',
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
      description: 'Comparte el enlace o termina la instalacion para empezar a recibir pruebas reales.',
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
    ? 'Todavia faltan algunos pasos clave para dejar tu cuenta lista y empezar a compartir el probador.'
    : completedSteps < totalSteps
      ? 'La base ya esta resuelta. Falta terminar instalacion, contenido o lanzamiento para quedar operando.'
      : 'Tu cuenta ya tiene continuidad desde el registro hasta el uso. Ahora la prioridad es crecer y optimizar resultados.';

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
        ? 'Probador listo'
        : widgetInstalled
          ? 'Conexion iniciada'
          : 'Sin instalacion detectada',
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
        : 'Sin pruebas todavia',
      tone: hasTryOns ? 'ok' : 'muted',
    },
    {
      id: 'sync',
      label: 'Ultima actividad',
      value: wooMetrics?.telemetry?.lastSyncAt
        ? new Date(wooMetrics.telemetry.lastSyncAt).toLocaleString('es-CO')
        : 'Sin actividad reciente',
      tone: wooMetrics?.telemetry?.lastSyncAt ? 'ok' : 'muted',
    },
  ];

  return {
    progressPercent,
    completedSteps,
    totalSteps,
    isActivationFocused: !hasTryOns || !hasProducts || (showIntegrationSteps && (!storeConnected || !widgetInstalled)),
    statusTitle,
    statusDescription,
    nextAction,
    checklist,
    systemChecks,
  };
}
