import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || 'https://vkdooutklowctuudjnkl.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey!);

async function checkSettings() {
  const { data: settings, error } = await supabase
    .from('payment_settings')
    .select('*')
    .eq('id', 1)
    .single();

  if (error) {
    console.error('Error fetching settings:', error);
  } else {
    console.log('Payment Settings:');
    console.log(' - wompi_test_mode:', settings.wompi_test_mode);
    console.log(' - wompi_public_key:', settings.wompi_public_key?.slice(0, 15) + '...');
    console.log(' - wompi_prod_public_key:', settings.wompi_prod_public_key?.slice(0, 15) + '...');
    console.log(' - wompi_enabled:', settings.wompi_enabled);
    console.log(' - wompi_events_secret:', settings.wompi_events_secret?.slice(0, 10) + '...');
    console.log(' - wompi_prod_events_secret:', settings.wompi_prod_events_secret?.slice(0, 10) + '...');
    console.log(' - ENV (TEST) events_secret:', process.env.WOMPI_EVENTS_SECRET?.slice(0, 10) + '...');
  }
}

checkSettings();
