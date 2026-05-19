const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://vkdooutklowctuudjnkl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrZG9vdXRrbG93Y3R1dWRqbmtsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDc2NTY2NSwiZXhwIjoyMDg2MzQxNjY1fQ.NxXV0Too3Iadb0FGuC8powPUuaMPiF1TKIUVtGMyFpg'
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