/**
 * Módulo de integración con Cloudflare Turnstile (widget invisible/visible anti-bot).
 *
 * Usa el script vanilla de Cloudflare para evitar dependencias extra.
 * Documentación: https://developers.cloudflare.com/turnstile/
 *
 * Uso:
 *   import { loadTurnstileWidget, resetTurnstileWidget } from '@/lib/turnstile';
 *   const widgetId = loadTurnstileWidget(containerRef.current, (token) => {
 *     setTurnstileToken(token);
 *   });
 *   // Para re-renderizar (ej: después de error):
 *   resetTurnstileWidget(widgetId);
 */

export interface TurnstileInstance {
  /** Resetea el widget (nuevo challenge) */
  reset: () => void;
  /** Elimina el widget del DOM */
  remove: () => void;
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          'error-callback'?: () => void;
          'expired-callback'?: () => void;
          theme?: 'light' | 'dark' | 'auto';
          tabindex?: number;
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

let scriptLoaded = false;
let scriptLoading = false;
const loadCallbacks: Array<() => void> = [];

/**
 * Carga el script de Turnstile una sola vez por página.
 */
function loadScript(): Promise<void> {
  if (scriptLoaded) return Promise.resolve();
  if (scriptLoading) {
    return new Promise((resolve) => loadCallbacks.push(resolve));
  }

  scriptLoading = true;

  return new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      scriptLoaded = true;
      scriptLoading = false;
      loadCallbacks.forEach((cb) => cb());
      loadCallbacks.length = 0;
      resolve();
    };
    script.onerror = () => {
      scriptLoading = false;
      reject(new Error('No se pudo cargar el script de Cloudflare Turnstile'));
    };
    document.head.appendChild(script);
  });
}

/**
 * Carga el widget de Turnstile en un contenedor.
 *
 * @param container  - Ref al div donde se renderiza el widget.
 * @param onSuccess   - Callback con el token cuando el usuario resuelve el challenge.
 * @param theme       - 'light' | 'dark' | 'auto' (default: 'auto')
 * @param size        - 'normal' | 'compact' (default: 'normal')
 * @returns Instancia con .reset() y .remove()
 */
export async function loadTurnstileWidget(
  container: HTMLElement,
  onSuccess: (token: string) => void,
  theme: 'light' | 'dark' | 'auto' = 'auto',
  size: 'normal' | 'compact' = 'normal'
): Promise<TurnstileInstance | null> {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  if (!siteKey) {
    console.warn('[Turnstile] NEXT_PUBLIC_TURNSTILE_SITE_KEY no está configurado. El widget no se renderizará.');
    return null;
  }

  try {
    await loadScript();
  } catch (err) {
    console.error('[Turnstile] Error al cargar el script:', err);
    return null;
  }

  if (!window.turnstile) {
    console.error('[Turnstile] window.turnstile no disponible después de cargar el script.');
    return null;
  }

  const widgetId = window.turnstile.render(container, {
    sitekey: siteKey,
    callback: onSuccess,
    'error-callback': () => {
      console.warn('[Turnstile] Error en el widget.');
    },
    'expired-callback': () => {
      // El token expiró, el usuario debe resolver otro challenge
      console.debug('[Turnstile] Token expirado.');
    },
    theme,
    tabindex: 0,
    ...(size === 'compact' ? { size: 'compact' as unknown as undefined } : {}),
  });

  return {
    reset: () => window.turnstile?.reset(widgetId),
    remove: () => window.turnstile?.remove(widgetId),
  };
}

/**
 * Resetea un widget existente (nuevo challenge).
 * Útil cuando el usuario intenta reenviar un formulario y el token expiró.
 */
export function resetTurnstileWidget(instance: TurnstileInstance | null) {
  instance?.reset();
}
