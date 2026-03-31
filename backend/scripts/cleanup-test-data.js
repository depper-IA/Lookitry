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

function getArgs(flag) {
  const values = [];
  for (let i = 0; i < process.argv.length; i += 1) {
    if (process.argv[i] === flag && process.argv[i + 1]) {
      values.push(process.argv[i + 1].toLowerCase());
    }
  }
  return values;
}

function hasFlag(flag) {
  return process.argv.includes(flag);
}

async function main() {
  const keepEmails = new Set(getArgs('--keep-email'));
  const apply = hasFlag('--apply');

  if (keepEmails.size === 0) {
    throw new Error('Debes indicar al menos un --keep-email para evitar borrados accidentales.');
  }

  const { data: brands, error } = await supabaseAdmin
    .from('brands')
    .select('id, email, name, slug, plan, subscription_status, trial_end_date, trial_payment_status')
    .order('updated_at', { ascending: false })
    .limit(500);

  if (error) {
    throw new Error(`No se pudieron consultar las marcas: ${error.message}`);
  }

  const toDelete = (brands || []).filter((brand) => {
    const email = String(brand.email || '').toLowerCase();
    return email && !keepEmails.has(email);
  });

  console.log(JSON.stringify({
    keepEmails: Array.from(keepEmails),
    deleteCount: toDelete.length,
    toDelete: toDelete.map((brand) => ({
      id: brand.id,
      email: brand.email,
      name: brand.name,
      slug: brand.slug,
      plan: brand.plan,
      subscription_status: brand.subscription_status,
      trial_end_date: brand.trial_end_date,
      trial_payment_status: brand.trial_payment_status,
    })),
  }, null, 2));

  if (!apply) {
    console.log('[cleanup-test-data] Modo diagnóstico. No se aplicaron cambios.');
    return;
  }

  const ids = toDelete.map((brand) => brand.id);
  if (ids.length === 0) {
    console.log('[cleanup-test-data] No hay marcas por eliminar.');
    return;
  }

  const tables = [
    'generations',
    'products',
    'subscription_payments',
    'paypal_orders',
    'plan_change_requests',
    'notifications',
    'notification_preferences',
    'reviews',
  ];

  for (const table of tables) {
    const { error: tableError } = await supabaseAdmin
      .from(table)
      .delete()
      .in('brand_id', ids);

    if (tableError && !/does not exist/i.test(tableError.message || '')) {
      throw new Error(`No se pudo limpiar ${table}: ${tableError.message}`);
    }
  }

  const { error: pendingError } = await supabaseAdmin
    .from('pending_registrations')
    .delete()
    .in('email', toDelete.map((brand) => brand.email));

  if (pendingError) {
    throw new Error(`No se pudo limpiar pending_registrations: ${pendingError.message}`);
  }

  const { error: brandDeleteError } = await supabaseAdmin
    .from('brands')
    .delete()
    .in('id', ids);

  if (brandDeleteError) {
    throw new Error(`No se pudieron eliminar las marcas: ${brandDeleteError.message}`);
  }

  console.log(`[cleanup-test-data] Se eliminaron ${ids.length} marcas y sus registros relacionados.`);
}

main().catch((error) => {
  console.error('[cleanup-test-data] Error:', error.message || error);
  process.exit(1);
});
