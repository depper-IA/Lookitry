const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function main() {
  const brandId = 'cf95f272-8de9-45e2-9290-d026312f2c31';

  const { data: synced } = await supabase
    .from('products')
    .select('id, name, external_id, is_active')
    .eq('brand_id', brandId)
    .not('external_id', 'is', null);

  console.log('SYNCED PRODUCTS:', JSON.stringify(synced, null, 2));

  const { data: all } = await supabase
    .from('products')
    .select('id, name, external_id, is_active')
    .eq('brand_id', brandId);

  console.log('ALL PRODUCTS:', JSON.stringify(all.map(p => ({ id: p.id, name: p.name, external_id: p.external_id })), null, 2));
}

main().catch(console.error);