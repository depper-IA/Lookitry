
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../backend/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function testStats() {
  try {
    console.log('Testing brands count...');
    const { count: brandsCount, error: brandsError } = await supabaseAdmin
      .from('brands')
      .select('id', { count: 'exact', head: true });
    
    if (brandsError) throw brandsError;
    console.log('Brands count:', brandsCount);

    console.log('Testing generations count...');
    const { count: generationsCount, error: generationsError } = await supabaseAdmin
      .from('generations')
      .select('id', { count: 'exact', head: true });
    
    if (generationsError) throw generationsError;
    console.log('Generations count:', generationsCount);

    console.log('Testing brand_reviews rating...');
    const { data: reviewsData, error: reviewsError } = await supabaseAdmin
      .from('brand_reviews')
      .select('rating')
      .eq('status', 'approved');
    
    if (reviewsError) throw reviewsError;
    console.log('Reviews data:', reviewsData);

    const avgRating = reviewsData && reviewsData.length > 0
      ? reviewsData.reduce((sum, r) => sum + Number(r.rating), 0) / reviewsData.length
      : 0;
    
    console.log('Avg Rating:', avgRating);
    console.log('Success!');
  } catch (err) {
    console.error('Error during test:', err);
  }
}

testStats();
