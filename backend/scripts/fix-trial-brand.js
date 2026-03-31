const path = require('path');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env.local'), override: true });

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Faltan SUPABASE_URL o SUPABASE_SERVICE_KEY/SUPABASE_SERVICE_ROLE_KEY en el entorno.');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

function getArg(flag) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return null;
  return process.argv[idx + 1] || null;
}

function hasFlag(flag) {
  return process.argv.includes(flag);
}

async function getActiveCampaign() {
  const nowIso = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from('trial_campaigns')
    .select('trial_days, trial_generations_limit')
    .eq('active', true)
    .or(`ends_at.is.null,ends_at.gt.${nowIso}`)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.warn('[fix-trial-brand] No se pudo cargar campaign activa, usando fallbacks:', error.message);
  }

  return {
    trialDays: data?.trial_days ?? 7,
    trialGenerationsLimit: data?.trial_generations_limit ?? 15,
  };
}

async function main() {
  const email = String(getArg('--email') || '').trim().toLowerCase();
  const apply = hasFlag('--apply');
  const setPlan = hasFlag('--set-plan');

  if (!email) {
    throw new Error('Debes indicar --email correo@dominio.com');
  }

  const { data: brand, error: brandError } = await supabaseAdmin
    .from('brands')
    .select('id, email, name, slug, plan, subscription_status, subscription_start_date, subscription_end_date, next_payment_date, trial_end_date, trial_generations_limit, trial_payment_status, updated_at')
    .ilike('email', email)
    .maybeSingle();

  if (brandError) {
    throw new Error(`No se pudo consultar la marca: ${brandError.message}`);
  }

  if (!brand) {
    throw new Error(`No existe una marca para ${email}`);
  }

  const { data: pendingRows, error: pendingError } = await supabaseAdmin
    .from('pending_registrations')
    .select('id, email, reference, plan, status, amount, created_at, payment_id')
    .ilike('email', email)
    .order('created_at', { ascending: false })
    .limit(10);

  if (pendingError) {
    throw new Error(`No se pudo consultar pending_registrations: ${pendingError.message}`);
  }

  const trialPending = (pendingRows || []).find((row) => {
    const reference = String(row.reference || '').toUpperCase();
    const plan = String(row.plan || '').toUpperCase();
    return reference.startsWith('GUEST-TRIAL-') || reference.startsWith('TRIAL-') || plan === 'TRIAL';
  });

  const hasTrialEvidence = Boolean(trialPending) || Boolean(brand.trial_end_date);

  console.log('[fix-trial-brand] Marca encontrada:');
  console.log(JSON.stringify(brand, null, 2));
  console.log('[fix-trial-brand] Pendings recientes:');
  console.log(JSON.stringify(pendingRows || [], null, 2));

  if (!hasTrialEvidence) {
    throw new Error(`No encontré evidencia suficiente de trial para ${email}. Abortado.`);
  }

  const campaign = await getActiveCampaign();
  const now = new Date();

  let trialEndDate = brand.trial_end_date ? new Date(brand.trial_end_date) : null;
  if (!trialEndDate || Number.isNaN(trialEndDate.getTime())) {
    trialEndDate = new Date(now);
    trialEndDate.setDate(trialEndDate.getDate() + campaign.trialDays);
  }

  const subscriptionStatus = trialEndDate > now ? 'active' : 'expired';
  const updateData = {
    subscription_status: subscriptionStatus,
    subscription_end_date: trialEndDate.toISOString(),
    next_payment_date: trialEndDate.toISOString(),
    trial_end_date: trialEndDate.toISOString(),
    trial_generations_limit: brand.trial_generations_limit || campaign.trialGenerationsLimit,
    trial_payment_status: 'active',
    ...(setPlan ? { plan: 'TRIAL' } : {}),
  };

  console.log('[fix-trial-brand] Corrección propuesta:');
  console.log(JSON.stringify(updateData, null, 2));

  if (!apply) {
    console.log('[fix-trial-brand] Modo diagnóstico. No se aplicaron cambios.');
    return;
  }

  const { error: updateError } = await supabaseAdmin
    .from('brands')
    .update(updateData)
    .eq('id', brand.id);

  if (updateError) {
    throw new Error(`No se pudo actualizar la marca: ${updateError.message}`);
  }

  const { data: updatedBrand, error: fetchUpdatedError } = await supabaseAdmin
    .from('brands')
    .select('id, email, name, slug, plan, subscription_status, subscription_end_date, next_payment_date, trial_end_date, trial_generations_limit, trial_payment_status, updated_at')
    .eq('id', brand.id)
    .single();

  if (fetchUpdatedError) {
    throw new Error(`La marca se actualizó pero no se pudo verificar: ${fetchUpdatedError.message}`);
  }

  console.log('[fix-trial-brand] Marca actualizada:');
  console.log(JSON.stringify(updatedBrand, null, 2));
}

main().catch((error) => {
  console.error('[fix-trial-brand] Error:', error.message || error);
  process.exit(1);
});
