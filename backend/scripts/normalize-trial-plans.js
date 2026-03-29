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

async function run() {
  const now = new Date();

  const { data: brands, error } = await supabaseAdmin
    .from('brands')
    .select('id, email, name, plan, subscription_status, trial_end_date, updated_at')
    .eq('plan', 'BASIC')
    .not('trial_end_date', 'is', null)
    .order('updated_at', { ascending: false });

  if (error) {
    throw new Error(`No se pudieron cargar marcas: ${error.message}`);
  }

  const candidates = (brands || []).filter((brand) => {
    const trialEnd = brand.trial_end_date ? new Date(brand.trial_end_date) : null;
    if (!trialEnd) return false;

    const hasFutureTrial = trialEnd > now;
    const hasLegacyNonPaidStatus = !['active', 'expiring_soon'].includes(brand.subscription_status || '');

    return hasFutureTrial || hasLegacyNonPaidStatus;
  });

  console.log(`[normalize-trial-plans] Candidatas detectadas: ${candidates.length}`);

  if (candidates.length === 0) {
    console.log('[normalize-trial-plans] No hay marcas históricas por normalizar.');
    return;
  }

  for (const brand of candidates) {
    const trialEnd = brand.trial_end_date ? new Date(brand.trial_end_date) : null;
    const derivedKind = trialEnd && trialEnd > now ? 'trial_vigente' : 'trial_historico';
    console.log(
      `[normalize-trial-plans] ${brand.id} | ${brand.email} | plan=${brand.plan} | status=${brand.subscription_status || 'null'} | ${derivedKind}`
    );
  }

  console.log('[normalize-trial-plans] La base actual no soporta plan_type=TRIAL; la corrección se hace por derivación en backend/frontend.');
}

run().catch((error) => {
  console.error('[normalize-trial-plans] Falló la normalización:', error);
  process.exit(1);
});
