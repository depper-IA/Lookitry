import subprocess

# Test HTTPS from container using Node.js
# We need to use a file because heredoc escaping in SSH is painful
script_content = '''
const https = require('https');
const url = 'https://wilkiedevs.com/wp-content/uploads/2026/03/casco.png';
console.log('Testing HTTPS from container to:', url);
const req = https.get(url, (r) => {
  console.log('Status:', r.statusCode, 'CT:', r.headers['content-type']);
  process.exit(0);
});
req.on('error', (e) => {
  console.log('Error:', e.message, 'code:', e.code);
  process.exit(1);
});
req.setTimeout(10000, () => {
  console.log('TIMEOUT');
  process.exit(1);
});
'''

# Write script to /tmp on VPS
with open('/tmp/test_img.js', 'w') as f:
    f.write(script_content)

# Copy to container and run
result = subprocess.run([
    'ssh', '-o', 'ConnectTimeout=15', '-o', 'StrictHostKeyChecking=no',
    'root@31.220.18.39',
    'docker cp /tmp/test_img.js lookitry-backend:/tmp/test_img.js && docker exec lookitry-backend node /tmp/test_img.js'
], capture_output=True, text=True, timeout=45)

print('STDOUT:', result.stdout)
print('STDERR:', result.stderr[:500] if result.stderr else '')
print('RC:', result.returncode)
