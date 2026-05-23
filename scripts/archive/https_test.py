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

print("=== HTTPS Test (port 443) - Direct Backend ===")

# Test HTTPS which worked
tests = [
    ("GET /api/brands (HTTPS)", 'curl -s -w "\\nHTTP:%{http_code}" https://localhost:443/api/brands -H "Host: api.lookitry.com" --insecure'),
    ("GET /health (HTTPS)", 'curl -s -w "\\nHTTP:%{http_code}" https://localhost:443/health -H "Host: api.lookitry.com" --insecure'),
    ("POST /api/auth/register (HTTPS)", 'curl -s -X POST -w "\\nHTTP:%{http_code}" https://localhost:443/api/auth/register -H "Host: api.lookitry.com" -H "Content-Type: application/json" -d "{}" --insecure'),
    ("GET / (HTTPS - frontend)", 'curl -s -w "\\nHTTP:%{http_code}" https://localhost:443/ -H "Host: lookitry.com" --insecure | tail -5'),
]

for name, cmd in tests:
    print(f"\n{name}:")
    stdin, stdout, stderr = ssh.exec_command(cmd)
    print(stdout.read().decode()[:400])

print("\n=== HTTP Test (port 80) - Should redirect to HTTPS or 404 ===")
stdin, stdout, stderr = ssh.exec_command('curl -s -L -w "\\nHTTP:%{http_code}" http://localhost:80/api/brands -H "Host: api.lookitry.com" 2>&1 | tail -3')
print(stdout.read().decode()[:400])

print("\n=== All Routers EntryPoints ===")
stdin, stdout, stderr = ssh.exec_command('curl -s http://localhost:8080/api/http/routers 2>/dev/null | python3 -c "import sys,json; [print(r[\"name\"], r.get(\"entryPoints\",[])) for r in json.load(sys.stdin)]"')
print(stdout.read().decode())

ssh.close()