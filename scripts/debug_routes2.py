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

print("=== Check what routes are registered ===")

# Look at the full app.js to see all route registrations
print("1. Full app.js route registrations:")
stdin, stdout, stderr = ssh.exec_command('docker exec lookitry-backend sh -c "grep -n \\"router.use\\|app.use\\|apiRouter\\|router.get\\|router.post\\|router.put\\|router.delete\\|app.get\\|app.post\\" /app/dist/app.js"')
print(stdout.read().decode()[:2000])

print("\n2. Check auth.routes.js to see what paths it defines:")
stdin, stdout, stderr = ssh.exec_command('docker exec lookitry-backend sh -c "grep -n \\"router.\\|post(\\|get(\\|put(\\|delete(\\|\\\"/" /app/dist/routes/auth.routes.js 2>/dev/null | head -30"')
print(stdout.read().decode()[:1000])

print("\n3. Check index.routes.js to see if /auth is mounted:")
stdin, stdout, stderr = ssh.exec_command('docker exec lookitry-backend sh -c "grep -n \\"auth\\|use\\|router\\" /app/dist/routes/index.js | head -20"')
print(stdout.read().decode()[:1000])

ssh.close()