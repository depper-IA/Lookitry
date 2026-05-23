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

print("=== Checking backend REDIS env ===")
stdin, stdout, stderr = ssh.exec_command('docker exec lookitry-backend sh -c "env"')
env_output = stdout.read().decode()

# Filter for redis
for line in env_output.split('\n'):
    if 'redis' in line.lower() or 'REDIS' in line:
        print(line)

print("\n=== Looking for all Redis-related env ===")
stdin, stdout, stderr = ssh.exec_command('docker exec lookitry-backend env 2>&1')
output = stdout.read().decode()
for line in output.split('\n'):
    if 'redis' in line.lower():
        print(line)

# Check if REDIS_URL is in .env.production
print("\n=== .env.production on VPS ===")
stdin, stdout, stderr = ssh.exec_command("cat /root/virtual-tryon/backend/.env.production | grep -i redis || echo 'No REDIS var found'")
print(stdout.read().decode())

ssh.close()