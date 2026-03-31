import { supabaseAdmin } from '../config/supabase';

export type PlanChangeStatus = 'pending' | 'processing' | 'completed' | 'failed';

function isMissingPlanChangeTable(error: { message?: string } | null | undefined): boolean {
  const message = String(error?.message || '').toLowerCase();
  return (
    message.includes('plan_change_requests') &&
    (
      message.includes('does not exist') ||
      message.includes('relation') ||
      message.includes('schema cache')
    )
  );
}

export class PlanChangeService {
  async createPending(payload: {
    brandId: string;
    reference: string;
    source: 'wompi' | 'paypal' | 'free_upgrade';
    fromPlan: string | null;
    toPlan: string;
    months: number;
    amountExpected?: number | null;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    const { error } = await supabaseAdmin.from('plan_change_requests').upsert({
      brand_id: payload.brandId,
      reference: payload.reference,
      source: payload.source,
      from_plan: payload.fromPlan,
      to_plan: payload.toPlan,
      months: payload.months,
      amount_expected: payload.amountExpected ?? null,
      amount_paid: null,
      status: 'pending',
      error_message: null,
      metadata: payload.metadata ?? {},
    }, {
      onConflict: 'reference',
    });

    if (error) {
      if (isMissingPlanChangeTable(error)) {
        console.warn('[PlanChangeService] Tabla plan_change_requests no disponible. Se omite trazabilidad de upgrade.', error.message);
        return;
      }
      throw new Error(`No se pudo persistir plan_change_request: ${error.message}`);
    }
  }

  async markProcessing(reference: string, amountPaid?: number | null): Promise<void> {
    const patch: Record<string, unknown> = { status: 'processing', error_message: null };
    if (typeof amountPaid === 'number') patch.amount_paid = amountPaid;

    const { error } = await supabaseAdmin
      .from('plan_change_requests')
      .update(patch)
      .eq('reference', reference)
      .in('status', ['pending', 'failed']);

    if (error) {
      if (isMissingPlanChangeTable(error)) {
        console.warn('[PlanChangeService] Tabla plan_change_requests no disponible. No se pudo marcar processing.', error.message);
        return;
      }
      throw new Error(`No se pudo marcar plan_change_request en processing: ${error.message}`);
    }
  }

  async markCompleted(reference: string, amountPaid?: number | null): Promise<void> {
    const patch: Record<string, unknown> = { status: 'completed', error_message: null };
    if (typeof amountPaid === 'number') patch.amount_paid = amountPaid;

    const { error } = await supabaseAdmin
      .from('plan_change_requests')
      .update(patch)
      .eq('reference', reference);

    if (error) {
      if (isMissingPlanChangeTable(error)) {
        console.warn('[PlanChangeService] Tabla plan_change_requests no disponible. No se pudo marcar completed.', error.message);
        return;
      }
      throw new Error(`No se pudo completar plan_change_request: ${error.message}`);
    }
  }

  async markFailed(reference: string, message: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('plan_change_requests')
      .update({ status: 'failed', error_message: message })
      .eq('reference', reference);

    if (error) {
      if (isMissingPlanChangeTable(error)) {
        console.warn('[PlanChangeService] Tabla plan_change_requests no disponible. No se pudo marcar failed.', error.message);
        return;
      }
      throw new Error(`No se pudo marcar plan_change_request como failed: ${error.message}`);
    }
  }
}

export const planChangeService = new PlanChangeService();
