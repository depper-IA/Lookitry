import * as dotenv from 'dotenv';
import path from 'path';
import axios from 'axios';
import crypto from 'crypto';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const API_URL = 'http://localhost:3001/api';

async function testWompiWebhook() {
  console.log('\n--- Testing Wompi Webhook ---');
  
  // 1. Create a pending registration reference
  const reference = `TRYON-visitor_test_${Date.now()}-M1-PBASIC-${Date.now()}`;
  const amountInCents = 15000000; // 150,000 COP
  
  console.log('Using reference:', reference);

  // Generate HMAC signature if possible, or skip verification if we can bypass it for testing
  // Since we are testing the REAL backend, we need a valid signature or to know the secret.
  // Let's assume we have the secret in .env
  const secret = process.env.WOMPI_EVENTS_SECRET || '';
  
  const payload = {
    event: 'transaction.updated',
    data: {
      transaction: {
        id: 'test-tx-' + Date.now(),
        status: 'APPROVED',
        reference: reference,
        amount_in_cents: amountInCents,
        currency: 'COP',
        payment_method_type: 'CARD'
      }
    },
    sent_at: new Date().toISOString()
  };

  const rawBody = JSON.stringify(payload);
  const checksum = crypto
    .createHash('sha256')
    .update(rawBody + secret)
    .digest('hex');

  try {
    const response = await axios.post(`${API_URL}/payments/wompi/webhook`, rawBody, {
      headers: {
        'Content-Type': 'application/json',
        'x-event-checksum': checksum
      }
    });
    console.log('Wompi Webhook Response:', response.data);
  } catch (error: any) {
    console.error('Wompi Webhook Error:', error.response?.data || error.message);
  }
}

async function testPayPalRegistration() {
  console.log('\n--- Testing PayPal Post-Payment Registration ---');
  
  // This test requires a valid pending_registration in DB and a "mock" verify in the controller
  // Since we just updated the controller to call PayPal API, we can't easily mock it without 
  // changing the code or having a real Order ID.
  
  console.log('Note: PayPal test requires real API communication. Skipping automated call.');
  console.log('Verification: The registerPostPayment controller was updated to handle "method: paypal" and "orderId".');
}

async function run() {
  await testWompiWebhook();
  await testPayPalRegistration();
}

run().catch(console.error);
