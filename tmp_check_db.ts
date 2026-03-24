import { supabaseAdmin } from './backend/src/config/supabase';

async function checkColumns() {
  const { data, error } = await supabaseAdmin
    .from('payment_settings')
    .select('*')
    .limit(1)
    .single();
  
  if (error) {
    console.error('Error fetching settings:', error);
    return;
  }
  
  console.log('Columns in payment_settings:', Object.keys(data));
}

checkColumns();
