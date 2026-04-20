const https = require('https');
console.log('Testing HTTPS connection...');
https.get('https://wilkiedevs.com/wp-content/uploads/2026/03/casco.png', (res) => {
  console.log('Status:', res.statusCode);
  process.exit(0);
}).on('error', (e) => {
  console.error('Error:', e.message);
  process.exit(1);
});