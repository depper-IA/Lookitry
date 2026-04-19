// OpenClaw Gateway API Client
// v1.0 | Abril 2026

const GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL || 'http://localhost:18789';
const GATEWAY_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN || 'fca2235a378d3882993e733b5b15b729';

interface Session {
  key: string;
  status: string;
  label?: string;
  updatedAt: number;
  childSessions?: string[];
}

interface SessionsListResponse {
  count: number;
  sessions: Session[];
  hasMore: boolean;
  nextOffset: number | null;
}

export async function sessions_list(params: {
  limit?: number;
  kinds?: string[];
  messageLimit?: number;
  activeMinutes?: number;
}): Promise<SessionsListResponse> {
  const { limit = 50, kinds, activeMinutes, messageLimit = 0 } = params;

  const url = new URL(`${GATEWAY_URL}/v1/sessions/list`);
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('messageLimit', String(messageLimit));
  url.searchParams.set('includeTools', 'false');
  
  if (kinds && kinds.length > 0) {
    url.searchParams.set('kinds', kinds.join(','));
  }
  if (activeMinutes) {
    url.searchParams.set('activeMinutes', String(activeMinutes));
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${GATEWAY_TOKEN}`,
      'Content-Type': 'application/json',
    },
    next: { revalidate: 0 }, // Don't cache
  });

  if (!response.ok) {
    throw new Error(`OpenClaw API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export async function getSessionStatus(sessionKey: string): Promise<Session | null> {
  const url = `${GATEWAY_URL}/v1/sessions/${encodeURIComponent(sessionKey)}/status`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${GATEWAY_TOKEN}`,
      'Content-Type': 'application/json',
    },
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(`OpenClaw API error: ${response.status}`);
  }

  return response.json();
}
