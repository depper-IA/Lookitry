/**
 * Utility to load and interact with Cloudflare Turnstile.
 * Based on Cloudflare documentation: https://developers.cloudflare.com/turnstile/get-started/
 */

let scriptLoading = false;
let scriptLoaded = false;
let loadCallbacks: (() => void)[] = [];

/**
 * Loads the Turnstile script if not already loaded.
 */
function loadScript(): Promise<void> {
  if (scriptLoaded) return Promise.resolve();
  if (scriptLoading) {
    return new Promise((resolve) => loadCallbacks.push(resolve));
  }

  scriptLoading = true;

  return new Promise((resolve) => {
    // Check if it already exists in the window
    if (typeof window !== 'undefined' && window.turnstile) {
      scriptLoaded = true;
      scriptLoading = false;
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.id = 'cloudflare-turnstile-script';

    script.onload = () => {
      scriptLoaded = true;
      scriptLoading = false;
      console.log('[Turnstile] Script loaded successfully');
      loadCallbacks.forEach((cb) => cb());
      loadCallbacks.length = 0;
      resolve();
    };

    script.onerror = (err) => {
      scriptLoading = false;
      console.error('[Turnstile] Error loading script. Ad-blocker might be active.', err);
      // We don't reject here to avoid crashing the caller, 
      // but the widget won't render.
      resolve(); 
    };

    document.head.appendChild(script);
  });
}

/**
 * Interface for the Turnstile instance returned.
 */
export interface TurnstileInstance {
  reset: () => void;
  remove: () => void;
}

/**
 * Renders the Turnstile widget in the specified container.
 * @param container The HTML element to render the widget in.
 * @param onSuccess Callback called when challenge is solved.
 * @param theme Color theme of the widget.
 * @param size Size of the widget.
 */
export async function loadTurnstileWidget(
  container: HTMLElement,
  onSuccess: (token: string) => void,
  theme: 'light' | 'dark' | 'auto' = 'light',
  size: 'normal' | 'compact' = 'normal'
): Promise<TurnstileInstance | null> {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '0x4AAAAAAAsmy7e_yL9iyAXM';

  try {
    if (typeof window === 'undefined') return null;

    await loadScript();

    if (!window.turnstile) {
      console.warn('[Turnstile] window.turnstile not available after script load.');
      return null;
    }

    // Ensure the container is empty before rendering
    container.innerHTML = '';

    const widgetId = window.turnstile.render(container, {
      sitekey: siteKey,
      callback: (token: string) => {
        console.log('[Turnstile] Challenge success');
        onSuccess(token);
      },
      'error-callback': (error: any) => {
        console.error('[Turnstile] Widget error:', error);
      },
      'expired-callback': () => {
        console.warn('[Turnstile] Token expired');
        onSuccess(''); // Clear token
      },
      theme: theme === 'auto' ? 'light' : theme,
      appearance: 'always',
      size: size === 'compact' ? 'compact' : 'normal',
    });

    return {
      reset: () => window.turnstile?.reset(widgetId),
      remove: () => window.turnstile?.remove(widgetId),
    };
  } catch (error) {
    console.error('[Turnstile] Unexpected error in loadTurnstileWidget:', error);
    return null;
  }
}

/**
 * Global type definition for Turnstile.
 */
declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: any) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}
