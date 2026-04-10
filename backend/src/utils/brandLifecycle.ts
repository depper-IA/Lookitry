import { supabaseAdmin } from '../config/supabase';

export type TrialEventName =
  | 'trial_started'
  | 'trial_email_verified'
  | 'first_product_created'
  | 'first_generation_completed'
  | 'checkout_viewed'
  | 'trial_expiring'
  | 'trial_expired'
  | 'trial_converted';

export type LegalRequestType =
  | 'customers/data_request'
  | 'customers/redact'
  | 'shop/redact'
  | 'app/uninstalled';

export interface TrialEventRecord {
  id: string;
  type: TrialEventName;
  created_at: string;
  payload?: Record<string, unknown>;
}

export interface LegalRequestRecord {
  id: string;
  type: LegalRequestType;
  status: 'completed' | 'processing' | 'pending';
  created_at: string;
  completed_at?: string | null;
  source: 'dashboard_profile_modal' | 'webhook' | 'admin';
  summary?: string | null;
}

export interface LegalDataExportRecord {
  id: string;
  request_id: string;
  type: 'customers/data_request';
  status: 'available';
  format: 'json';
  created_at: string;
  expires_at: string;
  file_name: string;
  data: Record<string, unknown>;
}

function buildId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function getBrandSocialLinks(brand: any): Record<string, any> {
  return (brand?.social_links && typeof brand.social_links === 'object') ? brand.social_links : {};
}

export function isArchivedBrand(brand: any): boolean {
  const socialLinks = getBrandSocialLinks(brand);
  return Boolean(socialLinks.account_archived_at || socialLinks.shop_redacted_at);
}

export function isTrialOperationalBrand(brand: any): boolean {
  const hasTrialSignal =
    brand?.plan === 'TRIAL' ||
    brand?.trial_payment_status === 'active' ||
    brand?.trialPaymentStatus === 'active';

  if (!hasTrialSignal || !brand?.trial_end_date || brand?.subscription_status === 'suspended') return false;
  const trialEnd = new Date(brand.trial_end_date);
  return !Number.isNaN(trialEnd.getTime()) && trialEnd > new Date();
}

export function hasActivePaidSubscription(brand: any): boolean {
  if (brand?.plan === 'TRIAL' || isTrialOperationalBrand(brand)) {
    return false;
  }

  return brand?.subscription_status === 'active' || brand?.subscription_status === 'expiring_soon';
}

export function isTrialLandingBlocked(brand: any): boolean {
  return isTrialOperationalBrand(brand);
}

export function getTrialEvents(brand: any): TrialEventRecord[] {
  const socialLinks = getBrandSocialLinks(brand);
  return Array.isArray(socialLinks.trial_events) ? socialLinks.trial_events : [];
}

export function getLegalRequests(brand: any): LegalRequestRecord[] {
  const socialLinks = getBrandSocialLinks(brand);
  return Array.isArray(socialLinks.legal_requests) ? socialLinks.legal_requests : [];
}

export function getLegalDataExports(brand: any): LegalDataExportRecord[] {
  const socialLinks = getBrandSocialLinks(brand);
  return Array.isArray(socialLinks.legal_data_exports) ? socialLinks.legal_data_exports : [];
}

async function updateSocialLinks(brandId: string, updater: (current: Record<string, any>) => Record<string, any>): Promise<void> {
  const { data: brand, error } = await supabaseAdmin
    .from('brands')
    .select('social_links')
    .eq('id', brandId)
    .single();

  if (error || !brand) return;

  const current = getBrandSocialLinks(brand);
  const next = updater(current);

  await supabaseAdmin
    .from('brands')
    .update({ social_links: next })
    .eq('id', brandId);
}

export async function recordTrialEvent(
  brandId: string,
  type: TrialEventName,
  payload?: Record<string, unknown>
): Promise<void> {
  await updateSocialLinks(brandId, (current) => {
    const existing = Array.isArray(current.trial_events) ? current.trial_events : [];
    if (existing.some((event: TrialEventRecord) => event.type === type)) {
      return current;
    }

    const nextEvents = [
      ...existing,
      {
        id: buildId('trial'),
        type,
        created_at: new Date().toISOString(),
        ...(payload ? { payload } : {}),
      },
    ].slice(-50);

    return {
      ...current,
      trial_events: nextEvents,
    };
  });
}

export async function createLegalRequest(
  brandId: string,
  request: Omit<LegalRequestRecord, 'id' | 'created_at'>
): Promise<LegalRequestRecord> {
  const record: LegalRequestRecord = {
    id: buildId('legal'),
    created_at: new Date().toISOString(),
    ...request,
  };

  await updateSocialLinks(brandId, (current) => {
    const existing = Array.isArray(current.legal_requests) ? current.legal_requests : [];
    return {
      ...current,
      legal_requests: [record, ...existing].slice(0, 30),
    };
  });

  return record;
}

export function buildLegalDataExport(
  requestId: string,
  data: Record<string, unknown>
): LegalDataExportRecord {
  const createdAt = new Date();
  const expiresAt = new Date(createdAt);
  expiresAt.setDate(expiresAt.getDate() + 30);

  return {
    id: buildId('legal_export'),
    request_id: requestId,
    type: 'customers/data_request',
    status: 'available',
    format: 'json',
    created_at: createdAt.toISOString(),
    expires_at: expiresAt.toISOString(),
    file_name: `lookitry-data-export-${createdAt.toISOString().slice(0, 10)}.json`,
    data,
  };
}

export function getTrialCommercialScore(brand: any, metrics: {
  activeProducts: number;
  usedGenerations: number;
  checkoutViews: number;
  pluginValidated: boolean;
  emailVerified: boolean;
  usedLast3Days: boolean;
}) {
  let score = 0;
  score += Math.min(25, metrics.activeProducts * 10);
  score += Math.min(25, metrics.usedGenerations > 0 ? 25 : 0);
  score += metrics.emailVerified ? 10 : 0;
  score += metrics.pluginValidated ? 15 : 0;
  score += Math.min(15, metrics.checkoutViews * 5);
  score += metrics.usedLast3Days ? 10 : 0;

  const recommendation = score >= 70 ? 'PRO' : 'BASIC';
  return {
    score,
    recommendation,
  };
}
