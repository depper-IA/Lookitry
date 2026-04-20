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

print("=== Deep dive into env_file issue ===")

# Check all environment variables in container
print("1. All env vars in container:")
stdin, stdout, stderr = ssh.exec_command('docker exec lookitry-backend env')
all_env = stdout.read().decode()
for line in all_env.split('\n'):
    if 'NODE' in line or 'PORT' in line or 'MINIO' in line or 'REDIS' in line or 'SUPABASE' in line:
        print(line)

# Check if env_file is being read
print("\n2. Checking docker-compose backend service config:")
stdin, stdout, stderr = ssh.exec_command(
    'docker inspect lookitry-backend --format "{{json .Config.Env}}" | python3 -m json.tool'
)
print(stdout.read().decode())

print("\n3. Checking env_file in container filesystem:")
stdin, stdout, stderr = ssh.exec_command(
    'docker exec lookitry-backend sh -c "cat /root/virtual-tryon/backend/.env.production 2>/dev/null || echo file not found"'
)
print(stdout.read().decode())

# Try using docker compose config to see what env_file resolves to
print("\n4. Docker compose config for backend:")
stdin, stdout, stderr = ssh.exec_command(
    'cd /root/virtual-tryon && docker compose -f docker-compose.backend.yml config 2>&1 | head -60'
)
print(stdout.read().decode())

ssh.close()