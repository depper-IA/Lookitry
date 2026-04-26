export type PaymentBillingType =
  | 'trial_activation'
  | 'subscription'
  | 'landing'
  | 'upgrade'
  | 'addon'
  | 'unknown';

export interface PaymentLedgerSnapshot {
  version: 1;
  brandId: string | null;
  brandName: string | null;
  brandEmail: string | null;
  brandSlug: string | null;
  planPurchased: string | null;
  billingType: PaymentBillingType;
  includesLanding: boolean;
  brandPlanBefore: string | null;
  brandPlanAfter: string | null;
  archivedAt?: string | null;
}

const LEDGER_MARKER = '[ledger_snapshot]';

function safeParseJson<T>(value: string | null | undefined): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function parseLedgerSnapshotFromNotes(notes: string | null | undefined): PaymentLedgerSnapshot | null {
  if (!notes || !notes.includes(LEDGER_MARKER)) return null;
  const raw = notes.split(LEDGER_MARKER).pop()?.trim() || '';
  return safeParseJson<PaymentLedgerSnapshot>(raw);
}

export function attachLedgerSnapshotToNotes(
  notes: string | null | undefined,
  snapshot: PaymentLedgerSnapshot
): string {
  const cleanNotes = (notes || '').split(LEDGER_MARKER)[0].trim();
  const serialized = `${LEDGER_MARKER}${JSON.stringify(snapshot)}`;
  return cleanNotes ? `${cleanNotes}\n\n${serialized}` : serialized;
}

export function inferPlanPurchased(payment: any): string {
  const snapshot = parseLedgerSnapshotFromNotes(payment?.notes);
  if (snapshot?.planPurchased) return String(snapshot.planPurchased).toUpperCase();

  const reference = String(payment?.reference || '').toUpperCase();
  const notes = String(payment?.notes || '').toUpperCase();

  if (reference.startsWith('GUEST-TRIAL-') || reference.startsWith('TRIAL-') || notes.includes('TRIAL')) {
    return 'TRIAL';
  }

  const notesPlan = notes.match(/PLAN:\s*([A-Z_]+)/)?.[1];
  if (notesPlan) return notesPlan;

  const joinedPlan = payment?.brands?.plan;
  if (joinedPlan) return String(joinedPlan).toUpperCase();

  return 'BASIC';
}

export function inferBillingType(payment: any): PaymentBillingType {
  const snapshot = parseLedgerSnapshotFromNotes(payment?.notes);
  if (snapshot?.billingType) return snapshot.billingType;

  const reference = String(payment?.reference || '').toUpperCase();
  const notes = String(payment?.notes || '').toUpperCase();
  const monthsPaid = Number(payment?.months_paid || 0);

  if (reference.startsWith('ADDON-')) return 'addon';
  if (reference.startsWith('GUEST-TRIAL-') || reference.startsWith('TRIAL-') || notes.includes('TRIAL')) {
    return 'trial_activation';
  }
  if (notes.includes('CAMBIO DE PLAN') || notes.includes('UPGRADE') || payment?.payment_method === 'credit_proration') {
    return 'upgrade';
  }
  if (monthsPaid === 0 || notes.includes('SOLO LANDING') || notes.includes('LANDING PAGE')) {
    return 'landing';
  }
  return 'subscription';
}

export function inferIncludesLanding(payment: any): boolean {
  const snapshot = parseLedgerSnapshotFromNotes(payment?.notes);
  if (typeof snapshot?.includesLanding === 'boolean') return snapshot.includesLanding;
  const notes = String(payment?.notes || '').toUpperCase();
  return notes.includes('LANDING');
}

export function getPaymentDisplayBrand(payment: any): {
  name: string;
  email: string;
  slug: string;
  plan: string;
  archived: boolean;
  billingType: PaymentBillingType;
} {
  const snapshot = parseLedgerSnapshotFromNotes(payment?.notes);
  const plan = inferPlanPurchased(payment);
  const billingType = inferBillingType(payment);

  return {
    name: snapshot?.brandName || payment?.brands?.name || 'Marca archivada',
    email: snapshot?.brandEmail || payment?.brands?.email || 'â',
    slug: snapshot?.brandSlug || payment?.brands?.slug || '',
    plan,
    archived: !payment?.brands?.name || Boolean(snapshot?.archivedAt),
    billingType,
  };
}
