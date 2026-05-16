
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function run() {
  const { data, error } = await supabase
    .from('brands')
    .select('slug, name')
    .ilike('name', '%wilkie%');
  
  console.log(JSON.stringify({data, error}, null, 2));
  
  // Let's also check if 'wilkie-devs' exists exactly
  const { data: exact } = await supabase
    .from('brands')
    .select('slug')
    .eq('slug', 'wilkie-devs');
  
  console.log("Exact match:", JSON.stringify(exact, null, 2));
}
run();
