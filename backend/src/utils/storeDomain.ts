import { Request } from 'express';

function toUrl(raw?: string | null): URL | null {
  if (!raw) return null;

  let value = String(raw).trim().toLowerCase();
  if (!value) return null;

  if (!value.startsWith('http://') && !value.startsWith('https://')) {
    value = `https://${value}`;
  }

  try {
    return new URL(value);
  } catch {
    return null;
  }
}

export function normalizeHost(raw?: string | null): string | null {
  const url = toUrl(raw);
  return url ? url.hostname.replace(/^www\./, '') : null;
}

export function normalizeOrigin(raw?: string | null): string | null {
  const url = toUrl(raw);
  if (!url) return null;
  return `${url.protocol}//${url.hostname}`;
}

export function sanitizeDomainList(values: unknown): string[] {
  const source = Array.isArray(values)
    ? values
    : typeof values === 'string'
      ? values.split(',')
      : [];

  const deduped = new Set<string>();
  source.forEach((value) => {
    const normalized = normalizeOrigin(String(value || ''));
    if (normalized) deduped.add(normalized);
  });

  return Array.from(deduped);
}

export function getBrandAllowedOrigins(brand: any): string[] {
  const socialLinks = brand?.social_links || {};
  const configured = sanitizeDomainList(socialLinks.allowed_origins);
  const websiteOrigin = normalizeOrigin(socialLinks.website || brand?.website || null);
  const customDomainOrigin = normalizeOrigin(brand?.custom_domain || null);
  const wooPluginStoreOrigin = normalizeOrigin(socialLinks.woo_plugin_store_domain || null);

  const origins = new Set<string>();
  configured.forEach((origin) => origins.add(origin));
  if (websiteOrigin) origins.add(websiteOrigin);
  if (customDomainOrigin) origins.add(customDomainOrigin);
  if (wooPluginStoreOrigin) origins.add(wooPluginStoreOrigin);

  return Array.from(origins);
}

export function getBrandAllowedHosts(brand: any): string[] {
  return getBrandAllowedOrigins(brand)
    .map((origin) => normalizeHost(origin))
    .filter((host): host is string => Boolean(host));
}

export function getExpectedStoreHost(brand: any): string | null {
  const [firstHost] = getBrandAllowedHosts(brand);
  return firstHost || null;
}

export function getIncomingStoreHost(req: Request): string | null {
  const headerHost = req.headers['x-store-domain'] as string | undefined;
  const origin = req.headers.origin as string | undefined;
  const referer = req.headers.referer as string | undefined;

  return normalizeHost(headerHost) || normalizeHost(origin) || normalizeHost(referer);
}

export function isAllowedStoreHost(brand: any, req: Request): boolean {
  const allowedHosts = getBrandAllowedHosts(brand);
  const incomingHost = getIncomingStoreHost(req);

  if (allowedHosts.length === 0) return true;
  if (!incomingHost) return false;

  return allowedHosts.includes(incomingHost);
}
