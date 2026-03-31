import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabaseAdmin.from('addon_packages').select('*');
  console.log('Data:', data);
  console.log('Error:', error);
}

check();
