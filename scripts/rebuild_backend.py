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

print("=== Rebuilding backend container ===")

# Stop the crashing backend container first
print("\n1. Stopping backend container...")
stdin, stdout, stderr = ssh.exec_command("docker stop lookitry-backend 2>&1")
print(stdout.read().decode())

# Remove the old container
print("\n2. Removing old backend container...")
stdin, stdout, stderr = ssh.exec_command("docker rm lookitry-backend 2>&1")
print(stdout.read().decode())

# Rebuild the backend
print("\n3. Building backend image (this may take a few minutes)...")
stdin, stdout, stderr = ssh.exec_command(
    "cd /root/virtual-tryon && docker compose -f docker-compose.backend.yml build backend 2>&1",
    timeout=600
)
out = stdout.read().decode()
err = stderr.read().decode()
print(out)
if err:
    print("[stderr]", err)

# Start the backend
print("\n4. Starting backend container...")
stdin, stdout, stderr = ssh.exec_command(
    "cd /root/virtual-tryon && docker compose -f docker-compose.backend.yml up -d backend 2>&1"
)
print(stdout.read().decode())

# Wait a bit and check status
import time
time.sleep(10)

print("\n5. Checking container status...")
stdin, stdout, stderr = ssh.exec_command("docker ps -a --format '{{.Names}}\t{{.Status}}'")
print(stdout.read().decode())

print("\n6. Checking backend logs...")
stdin, stdout, stderr = ssh.exec_command("docker logs --tail 30 lookitry-backend 2>&1")
print(stdout.read().decode())

# Check if n8n is running (not in docker)
print("\n7. Checking if n8n is running on port 5678...")
stdin, stdout, stderr = ssh.exec_command("ss -tlnp | grep 5678 || netstat -tlnp | grep 5678 || echo 'Port 5678 not found'")
print(stdout.read().decode())

# Check traefik routing for n8n
print("\n8. Checking traefik configuration for n8n...")
stdin, stdout, stderr = ssh.exec_command("docker inspect traefik 2>&1 | head -50")
print(stdout.read().decode())

ssh.close()
print("\n=== Done ===")