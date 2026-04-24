const fetch = require('fetch');
fetch('https://api.lookitry.com/api/home/tryon/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ productId: 'demo-product', selfieBase64: 'data:image/jpeg;base64,test' })
}).then(r => console.log('Status:', r.status, 'Body:', r.text));