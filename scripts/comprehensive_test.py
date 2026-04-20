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

print("=== Final Comprehensive Test ===")

# Test ALL endpoints from traefik with proper Host headers
tests = [
    ("GET / via traefik (Host: lookitry.com)", 'curl -s -w "\\nHTTP:%{http_code}" -H "Host: lookitry.com" http://localhost:80/ 2>&1 | tail -2'),
    ("GET /api/brands via traefik (Host: api.lookitry.com)", 'curl -s -w "\\nHTTP:%{http_code}" -H "Host: api.lookitry.com" http://localhost:80/api/brands 2>&1 | tail -2'),
    ("GET /health via traefik (Host: api.lookitry.com)", 'curl -s -w "\\nHTTP:%{http_code}" -H "Host: api.lookitry.com" http://localhost:80/health 2>&1 | tail -2'),
    ("POST /api/auth/register via traefik", 'curl -s -X POST -w "\\nHTTP:%{http_code}" -H "Host: api.lookitry.com" -H "Content-Type: application/json" -d "{}" http://localhost:80/api/auth/register 2>&1 | tail -2'),
]

for name, cmd in tests:
    print(f"\n{name}:")
    stdin, stdout, stderr = ssh.exec_command(cmd)
    result = stdout.read().decode()
    print(result[:300])

print("\n=== Test direct HTTP (port 80) ===")
stdin, stdout, stderr = ssh.exec_command('curl -s -w "\\nHTTP:%{http_code}" http://localhost:80/api/brands -H "Host: api.lookitry.com" 2>&1 | tail -2')
print(stdout.read().decode())

print("\n=== Test HTTPS direct (port 443) ===")
stdin, stdout, stderr = ssh.exec_command('curl -s -w "\\nHTTP:%{http_code}" https://localhost:443/api/brands -H "Host: api.lookitry.com" --insecure 2>&1 | tail -2')
print(stdout.read().decode())

ssh.close()