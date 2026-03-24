import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || 'https://vkdooutklowctuudjnkl.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseKey) {
  console.error('Missing SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBrand() {
  const brandId = 'cf95f272-8de9-45e2-9290-d026312f2c31';
  
  console.log('Querying brand ID:', brandId);
  
  const { data: brand, error: brandError } = await supabase
    .from('brands')
    .select('*')
    .eq('id', brandId)
    .single();

  if (brandError) {
    console.error('Error fetching brand:', brandError);
  } else {
    console.log('Brand found:', brand.id, brand.name, brand.plan, brand.subscription_end_date);
  }

  const { data: payments, error: payError } = await supabase
    .from('subscription_payments')
    .select('*')
    .eq('brand_id', brandId)
    .order('payment_date', { ascending: false });

  if (payError) {
    console.error('Error fetching payments:', payError);
  } else {
    console.log('Recent payments:', payments.length);
    payments.forEach(p => {
      console.log(`- ${p.payment_date}: ${p.amount} COP, status: ${p.status}`);
    });
  }
}

checkBrand();
