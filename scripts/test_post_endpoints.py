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

print("=== Testing POST endpoints (auth routes are POST only) ===")

# Auth routes are POST only, so test POST
tests = [
    ("POST /api/auth/register (empty)", 'curl -s -X POST -w "\\nHTTP:%{http_code}" -H "Content-Type: application/json" -d "{}" http://localhost:3001/api/auth/register'),
    ("POST /api/auth/login (empty)", 'curl -s -X POST -w "\\nHTTP:%{http_code}" -H "Content-Type: application/json" -d "{}" http://localhost:3001/api/auth/login'),
    ("POST /api/auth/check-email", 'curl -s -X POST -w "\\nHTTP:%{http_code}" -H "Content-Type: application/json" -d "{}" http://localhost:3001/api/auth/check-email'),
    ("GET /api/auth/slug-check?slug=test", 'curl -s -w "\\nHTTP:%{http_code}" "http://localhost:3001/api/auth/slug-check?slug=test"'),
]

for name, cmd in tests:
    print(f"\n{name}:")
    stdin, stdout, stderr = ssh.exec_command(cmd)
    print(stdout.read().decode()[:400])

print("\n=== Testing pruebalo routes ===")
stdin, stdout, stderr = ssh.exec_command('curl -s -w "\\nHTTP:%{http_code}" "http://localhost:3001/api/pruebalo/lookitry/health" 2>&1 | head -5')
print(stdout.read().decode()[:300])

ssh.close()