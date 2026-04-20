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

print("=== Search for api mounting in app.js ===")

# Search for /api usage in app.js
stdin, stdout, stderr = ssh.exec_command('docker exec lookitry-backend sh -c "grep -n \\"/api\\|apiRouter\\|router.use\\|/auth\\|authRoutes\\" /app/dist/app.js | head -30"')
print(stdout.read().decode())

print("\n=== Check if there's a different index file ===")
stdin, stdout, stderr = ssh.exec_command('docker exec lookitry-backend sh -c "ls -la /app/dist/*.js | head -20"')
print(stdout.read().decode())

print("\n=== Check index.js (server entry point) ===")
stdin, stdout, stderr = ssh.exec_command('docker exec lookitry-backend sh -c "cat /app/dist/index.js 2>/dev/null | head -100"')
print(stdout.read().decode())

ssh.close()