const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const { data, error } = await supabase
    .from('products')
    .select('name, image_url')
    .ilike('name', '%verde%');

  if (error) {
    console.error('Error:', error);
  } else {
    console.log(data);
  }
}

main();