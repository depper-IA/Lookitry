
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { createClient } = require('@supabase/supabase-js');
const { wompiService } = require('../services/wompi.service');
const { SubscriptionService } = require('../services/subscription.service');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: SUPABASE_URL o SUPABASE_SERVICE_KEY no encontrados en .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const subscriptionService = new SubscriptionService();

async function forceFulfillment() {
  const reference = 'TRYON-cf95f272-8de9-45e2-9290-d026312f2c31-M1-PBASIC-1774330760637';
  console.log('Verifying reference with Wompi:', reference);
  
  const wompiTx = await wompiService.getTransactionByReference(reference);
  console.log('Wompi Transaction Status:', wompiTx?.status || 'NOT FOUND');

  const brandId = wompiService.extractBrandIdFromReference(reference);
  const { months, includesLanding } = wompiService.extractMetaFromReference(reference);
  const targetPlan = 'PRO'; 

  console.log('Brand ID extracted:', brandId);
  console.log('Target Plan to apply:', targetPlan);

  console.log('Fulfilling subscription...');
  
  try {
      const { data: currentBrand } = await supabase
         .from('brands')
         .select('plan, name')
         .eq('id', brandId)
         .single();

      if (!currentBrand) {
        console.error('Brand not found:', brandId);
        return;
      }

      const isUpgrade = currentBrand.plan !== targetPlan;
      const amount = 290000; 

      await subscriptionService.renewSubscription(
        brandId,
        {
          brand_id: brandId,
          amount: amount,
          currency: 'COP',
          payment_date: new Date().toISOString(),
          payment_method: 'wompi_manual_fulfillment_fix',
          status: 'completed',
          months_paid: months,
          notes: `Corrección manual (Upgrade PRO). Ref original: ${reference}`,
        },
        months,
        targetPlan,
        isUpgrade
      );

      await supabase.from('brands').update({ has_landing_page: true, landing_suspended_at: null }).eq('id', brandId);

      console.log('SUCCESS: Subscription fulfilled manually as PRO for', currentBrand.name);
  } catch (err: any) {
    console.error('Error during fulfillment:', err.message);
  }
}

forceFulfillment();
