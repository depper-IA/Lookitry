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

function looksLikeTestAccount(brand) {
  const email = String(brand.email || '').toLowerCase();
  const name = String(brand.name || '').toLowerCase();
  const slug = String(brand.slug || '').toLowerCase();

  const patterns = [
    'test',
    'qa',
    'demo',
    'trial',
    'sam',
    'wilkie',
    'visitor',
    'fake',
    'tmp',
    'temp',
    'prueba',
  ];

  return patterns.some((pattern) =>
    email.includes(pattern) || name.includes(pattern) || slug.includes(pattern)
  );
}

async function main() {
  const { data: brands, error } = await supabaseAdmin
    .from('brands')
    .select('id, email, name, slug, plan, subscription_status, trial_end_date, trial_payment_status, created_at, updated_at')
    .order('updated_at', { ascending: false })
    .limit(500);

  if (error) {
    throw new Error(`No se pudieron consultar las marcas: ${error.message}`);
  }

  const candidates = (brands || []).filter(looksLikeTestAccount);
  console.log(JSON.stringify({
    totalBrandsScanned: brands?.length || 0,
    candidateCount: candidates.length,
    candidates,
  }, null, 2));
}

main().catch((error) => {
  console.error('[audit-test-accounts] Error:', error.message || error);
  process.exit(1);
});
