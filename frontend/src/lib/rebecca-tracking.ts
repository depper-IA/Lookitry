'use client';

/**
 * Helper para tracking de page visits de Rebecca (Spec: Rebecca 2.0 §6.4)
 * Usa sessionStorage para compartir session_id entre checkout y pago-exitoso
 */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'https://api.lookitry.com';
const SESSION_ID_KEY = 'rebecca_session_id';
const TRACKING_ENDPOINT = `${API_BASE}/api/chat/track-page`;

type TrackEvent = 'visit' | 'checkout_start' | 'checkout_complete';

/**
 * Obtiene o genera un session_id para tracking de Rebecca
 */
export function getRebeccaSessionId(): string {
  if (typeof window === 'undefined') return '';

  let sessionId = sessionStorage.getItem(SESSION_ID_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem(SESSION_ID_KEY, sessionId);
  }
  return sessionId;
}

/**
 * Envía tracking de página a Rebecca
 */
export async function trackPageEvent(
  event: TrackEvent,
  pageUrl: string
): Promise<void> {
  const sessionId = getRebeccaSessionId();
  if (!sessionId) return;

  try {
    await fetch(TRACKING_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        page_url: pageUrl,
        event,
      }),
    });
  } catch {
    // Non-critical, silently fail
  }
}