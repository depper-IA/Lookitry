import { supabaseAdmin } from './src/config/supabase';

async function run() {
  const { data, error } = await supabaseAdmin.from('category_attributes').select('*').in('category_key', ['cascos', 'lentes']);
  console.log(JSON.stringify(data, null, 2));
}
run();