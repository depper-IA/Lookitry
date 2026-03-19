
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  'https://vkdooutklowctuudjnkl.supabase.co',
  '***REMOVED-SECRET***'
);

async function findTrialBrand() {
  const { data, error } = await supabase
    .from('brands')
    .select('id, name, email, plan, subscription_status, trial_end_date')
    .or('subscription_status.eq.trial,subscription_status.is.null')
    .limit(1);

  if (error) {
    console.error('Error al buscar marca:', error);
    return;
  }

  if (!data || data.length === 0) {
    console.log('No se encontraron marcas en trial.');
    return;
  }

  console.log('Marca encontrada:', JSON.stringify(data[0], null, 2));
}

findTrialBrand();
