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

print("=== Test local endpoints inside container ===")

# Test local endpoint
print("1. GET /api/auth/register (local):")
stdin, stdout, stderr = ssh.exec_command('docker exec lookitry-backend wget -q -O- "http://localhost:3001/api/auth/register" 2>&1')
print(stdout.read().decode()[:300])

# Test health locally
print("\n2. GET /health (local):")
stdin, stdout, stderr = ssh.exec_command('docker exec lookitry-backend wget -q -O- "http://localhost:3001/health" 2>&1')
print(stdout.read().decode()[:300])

# Check app.js
print("\n3. Check app.js routes registration:")
stdin, stdout, stderr = ssh.exec_command('docker exec lookitry-backend sh -c "cat /app/dist/app.js 2>/dev/null | head -100"')
app_content = stdout.read().decode()
print(app_content[:2000])

# Find apiRouter mounting
if "apiRouter" in app_content:
    print("\n[OK] apiRouter found in app.js")
else:
    print("\n[ERROR] apiRouter NOT found in app.js!")

ssh.close()