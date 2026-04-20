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

print("=== Starting n8n, redis, and minio ===")

# Start services from lookitry-full project (which has n8n, redis, minio)
# Use --remove-orphans to clean up stale references to frontend/backend that are in virtual-tryon project
print("\n1. Starting services from lookitry-full...")
stdin, stdout, stderr = ssh.exec_command(
    "cd /root/virtual-tryon && docker compose -f docker-compose.lookitry-full.yml up -d --remove-orphans 2>&1",
    timeout=120
)
out = stdout.read().decode()
err = stderr.read().decode()
print(out)
if err:
    print("[stderr]", err[:500])

# Wait for services to start
print("\n2. Waiting 15 seconds for services to initialize...")
time.sleep(15)

# Check status
print("\n3. Checking all containers...")
stdin, stdout, stderr = ssh.exec_command("docker ps -a --format '{{.Names}}\t{{.Status}}'")
print(stdout.read().decode())

# Check n8n logs
print("\n4. Checking n8n logs...")
stdin, stdout, stderr = ssh.exec_command("docker logs --tail 20 root-n8n-1 2>&1")
print(stdout.read().decode())

# Check minio logs
print("\n5. Checking minio logs...")
stdin, stdout, stderr = ssh.exec_command("docker logs --tail 20 minio 2>&1")
print(stdout.read().decode())

# Check redis logs
print("\n6. Checking redis logs...")
stdin, stdout, stderr = ssh.exec_command("docker logs --tail 10 root-redis-1 2>&1")
print(stdout.read().decode())

# Test API health
print("\n7. Testing API health...")
stdin, stdout, stderr = ssh.exec_command("curl -s -w '\\nHTTP: %{http_code}' https://api.lookitry.com/health")
print(stdout.read().decode())

ssh.close()
print("\n=== Done ===")