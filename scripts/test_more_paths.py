import paramiko
from io import StringIO

key_path = "scripts/id_rsa_lookitry"
with open(key_path, 'r') as f:
    key_content = f.read()

key_file = StringIO(key_content)
key = paramiko.RSAKey.from_private_key(key_file)

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(hostname="31.220.18.39", username="root", pkey=key, timeout=15)

print("=== Test different API paths ===")

tests = [
    ("GET /api/auth", 'docker exec lookitry-backend wget -q -O- "http://localhost:3001/api/auth"'),
    ("GET /api/brands", 'docker exec lookitry-backend wget -q -O- "http://localhost:3001/api/brands"'),
    ("GET /api/products", 'docker exec lookitry-backend wget -q -O- "http://localhost:3001/api/products"'),
    ("GET /api/health", 'docker exec lookitry-backend wget -q -O- "http://localhost:3001/api/health"'),
]

for name, cmd in tests:
    print(f"\n{name}:")
    stdin, stdout, stderr = ssh.exec_command(cmd)
    result = stdout.read().decode()[:300]
    print(result)

# Check auth.routes.js content
print("\n=== Check auth.routes.js ===")
stdin, stdout, stderr = ssh.exec_command('docker exec lookitry-backend sh -c "cat /app/dist/routes/auth.routes.js | head -50"')
print(stdout.read().decode())

ssh.close()