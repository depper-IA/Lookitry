import paramiko
from io import StringIO
import time

key_path = "scripts/id_rsa_lookitry"
with open(key_path, 'r') as f:
    key_content = f.read()

key_file = StringIO(key_content)
key = paramiko.RSAKey.from_private_key(key_file)

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(hostname="31.220.18.39", username="root", pkey=key, timeout=15)

print("=== Recreating backend to pick up REDIS_URL ===")

# Stop and remove backend
print("1. Stopping and removing backend...")
ssh.exec_command("docker stop lookitry-backend && docker rm lookitry-backend")

# Start backend again (it will read env_file)
print("2. Starting backend...")
stdin, stdout, stderr = ssh.exec_command(
    "cd /root/virtual-tryon && docker compose -f docker-compose.backend.yml up -d backend 2>&1"
)
print(stdout.read().decode())

# Wait for backend to start
print("\n3. Waiting 20 seconds for backend to initialize...")
time.sleep(20)

# Check status
print("\n4. Container status:")
stdin, stdout, stderr = ssh.exec_command("docker ps --format '{{.Names}}\t{{.Status}}'")
print(stdout.read().decode())

# Check if REDIS_URL is now set
print("\n5. Checking REDIS_URL in container:")
stdin, stdout, stderr = ssh.exec_command('docker exec lookitry-backend sh -c "echo REDIS_URL=$REDIS_URL"')
print(stdout.read().decode())

# Test health
print("\n6. Health check:")
stdin, stdout, stderr = ssh.exec_command("docker exec lookitry-backend wget -q -O- http://localhost:3001/health")
print(stdout.read().decode())

ssh.close()