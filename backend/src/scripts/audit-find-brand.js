
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  'https://vkdooutklowctuudjnkl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrZG9vdXRrbG93Y3R1dWRqbmtsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDc2NTY2NSwiZXhwIjoyMDg2MzQxNjY1fQ.NxXV0Too3Iadb0FGuC8powPUuaMPiF1TKIUVtGMyFpg'
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
