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

print("=== Checking deployed backend code ===")

# Check what code is deployed
print("1. Routes in dist:")
stdin, stdout, stderr = ssh.exec_command('docker exec lookitry-backend sh -c "ls -la /app/dist/routes/"')
print(stdout.read().decode())

print("\n2. Check routes/index.js:")
stdin, stdout, stderr = ssh.exec_command('docker exec lookitry-backend sh -c "cat /app/dist/routes/index.js 2>/dev/null | head -30"')
print(stdout.read().decode())

print("\n3. Build timestamp:")
stdin, stdout, stderr = ssh.exec_command('docker inspect lookitry-backend --format "{{.Created}}"')
print(stdout.read().decode())

print("\n4. Git commit on VPS:")
stdin, stdout, stderr = ssh.exec_command('cd /root/virtual-tryon && git log -1 --oneline')
print(stdout.read().decode())

print("\n5. Local git commit:")
result = open('.git/HEAD', 'r').read().strip()
print(f"Local HEAD: {result}")

ssh.close()