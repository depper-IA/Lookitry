const dns = require('dns');
console.log('Testing DNS lookup...');
dns.lookup('wilkiedevs.com', (err, addr, family) => {
  console.log('Address:', addr, 'Family:', family, 'Error:', err);
});