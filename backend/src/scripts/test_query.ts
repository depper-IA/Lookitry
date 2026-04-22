import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase
    .from('brands')
    .select('id, name, social_links')
    .not('social_links->>account_archived_at', 'is', null);
    
  console.log('Archived brands found with .not(..., is, null):', data?.length);
  if (data) data.forEach(b => console.log(` - ${b.name}: ${b.social_links?.account_archived_at}`));

  const { data: data2, error: error2 } = await supabase
    .from('brands')
    .select('id, name, social_links')
    .is('social_links->>account_archived_at', null);

  console.log('Active brands found with .is(..., null):', data2?.length);
}

test();
