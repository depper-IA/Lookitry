import https from 'https';

const BREVO_API_KEY = process.env.BREVO_API_KEY;

if (!BREVO_API_KEY) {
  console.error('Missing BREVO_API_KEY env var');
  process.exit(1);
}

const payload = JSON.stringify({
  sender: {
    name: 'Lookitry',
    email: 'info@lookitry.com'
  },
  to: [{ email: 'samu.wilkie@gmail.com' }],
  subject: 'Test - Cómo Lookitry puede transformar tu tienda de moda',
  htmlContent: '<html><body><h1>Test Email from Lookitry</h1><p>This is a test to verify the Brevo API is working.</p></body></html>'
});

const options = {
  hostname: 'api.brevo.com',
  port: 443,
  path: '/v3/smtp/email',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'api-key': BREVO_API_KEY,
    'Content-Length': Buffer.byteLength(payload)
  }
};

console.log('Sending test email via Brevo API...');

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data);
  });
});

req.on('error', (e) => {
  console.error('Error:', e.message);
});

req.write(payload);
req.end();