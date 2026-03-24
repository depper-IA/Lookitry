import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { wompiService } from '../services/wompi.service';
import { SubscriptionService } from '../services/subscription.service';

dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || 'https://vkdooutklowctuudjnkl.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey!);

const subscriptionService = new SubscriptionService();

async function forceFulfillment() {
  const reference = 'TRYON-cf95f272-8de9-45e2-9290-d026312f2c31-M1-PBASIC-1774330760637';
  
  console.log('Verifying reference with Wompi:', reference);
  
  const wompiTx = await wompiService.getTransactionByReference(reference);
  
  if (!wompiTx) {
    console.error('Transaction not found in Wompi');
    return;
  }
  
  console.log('Wompi Transaction Status:', wompiTx.status);
  
  if (wompiTx.status !== 'APPROVED') {
    console.error('Transaction is not approved yet or failed in Wompi. Current status:', wompiTx.status);
    return;
  }

  // Si está aprobada, procedemos a cumplirla manualmente
  const brandId = wompiService.extractBrandIdFromReference(reference);
  const { months, plan, includesLanding } = wompiService.extractMetaFromReference(reference);
  
  if (!brandId) {
    console.error('Invalid reference, brandId not found');
    return;
  }

  console.log('Brand ID extracted:', brandId);
  console.log('Meta extracted:', { months, plan, includesLanding });

  // Verificar si ya fue procesada (evitar duplicados)
  const { data: existingPayment } = await supabase
    .from('subscription_payments')
    .select('id')
    .eq('notes', `Pago manual forzado. Ref: ${reference}`)
    .single();

  if (existingPayment) {
    console.warn('This fulfillment was already processed manually.');
    return;
  }

  // Monto (aproximado basado en el plan si el objeto tx no lo trae completo)
  // En BASIC es 150000 COP
  const amount = 150000; 

  console.log('Fulfilling subscription...');
  
  try {
     const { data: currentBrand } = await supabase
        .from('brands')
        .select('plan')
        .eq('id', brandId)
        .single();

      const isUpgrade = currentBrand?.plan !== plan.toUpperCase();

      await subscriptionService.renewSubscription(
        brandId,
        {
          brand_id: brandId,
          amount: amount,
          currency: 'COP',
          payment_date: new Date().toISOString(),
          payment_method: 'wompi_manual_fulfillment',
          status: 'completed',
          months_paid: months,
          notes: `Pago manual forzado. Ref: ${reference}`,
        },
        months,
        plan.toUpperCase(),
        isUpgrade
      );

      if (includesLanding) {
        await supabase
          .from('brands')
          .update({ has_landing_page: true, landing_suspended_at: null })
          .eq('id', brandId);
      }

      console.log('SUCCESS: Subscription fulfilled manually.');
  } catch (err: any) {
    console.error('Error during fulfillment:', err.message);
  }
}

forceFulfillment();
