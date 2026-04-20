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

print("=== Test POST endpoints properly ===")

# Use proper curl with variables
tests = [
    ("POST /api/auth/register", 'curl -s -X POST -H "Content-Type: application/json" -d "\\"test\\"" http://localhost:3001/api/auth/register'),
    ("POST /api/auth/login", 'curl -s -X POST -H "Content-Type: application/json" -d "\\"test\\"" http://localhost:3001/api/auth/login'),
    ("GET /api/auth/slug-check?slug=abc123", 'curl -s "http://localhost:3001/api/auth/slug-check?slug=abc123"'),
    ("GET /api/pruebalo/lookitry", 'curl -s "http://localhost:3001/api/pruebalo/lookitry"'),
]

for name, cmd in tests:
    print(f"\n{name}:")
    stdin, stdout, stderr = ssh.exec_command(cmd)
    result = stdout.read().decode()
    print(f"Response: {result[:500]}")

# Try with full path using escaped quotes
print("\n=== Test with properly escaped JSON ===")
cmd = 'curl -s -X POST -H "Content-Type: application/json" -d "{\\\"email\\\":\\\"test@test.com\\\"}" http://localhost:3001/api/auth/register'
print(f"Testing: {cmd}")
stdin, stdout, stderr = ssh.exec_command(cmd)
result = stdout.read().decode()
print(f"Response: {result[:500]}")

ssh.close()