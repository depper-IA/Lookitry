import { Request } from 'express';

function normalizeHost(raw?: string | null): string | null {
  if (!raw) return null;

  let value = String(raw).trim().toLowerCase();
  if (!value) return null;

  if (!value.startsWith('http://') && !value.startsWith('https://')) {
    value = `https://${value}`;
  }

  try {
    const url = new URL(value);
    return url.hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

export function getExpectedStoreHost(brand: any): string | null {
  return normalizeHost(brand?.social_links?.website || brand?.website || null);
}

export function getIncomingStoreHost(req: Request): string | null {
  const headerHost = req.headers['x-store-domain'] as string | undefined;
  const origin = req.headers.origin as string | undefined;
  const referer = req.headers.referer as string | undefined;

  return normalizeHost(headerHost) || normalizeHost(origin) || normalizeHost(referer);
}

export function isAllowedStoreHost(brand: any, req: Request): boolean {
  const expectedHost = getExpectedStoreHost(brand);
  const incomingHost = getIncomingStoreHost(req);

  if (!expectedHost || !incomingHost) return true;

  return expectedHost === incomingHost;
}
