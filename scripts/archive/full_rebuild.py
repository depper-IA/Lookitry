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

print("=== Full Backend Rebuild from Local Repo ===")

# Pull latest code from git
print("1. Pulling latest code from GitHub...")
stdin, stdout, stderr = ssh.exec_command("cd /root/virtual-tryon && git pull origin main 2>&1")
print(stdout.read().decode())
print(stderr.read().decode()[:500])

# Stop backend
print("\n2. Stopping backend...")
stdin, stdout, stderr = ssh.exec_command("docker stop lookitry-backend && docker rm lookitry-backend")
print(stdout.read().decode())

# Rebuild backend
print("\n3. Rebuilding backend (this takes 2-5 minutes)...")
stdin, stdout, stderr = ssh.exec_command(
    "cd /root/virtual-tryon && docker compose -f docker-compose.backend.yml build backend 2>&1",
    timeout=600
)
out = stdout.read().decode()
err = stderr.read().decode()
if "error" in out.lower() or "error" in err.lower():
    print("ERRORS:")
    print(out[-2000:])
    print(err[-1000:])
else:
    print("Build completed successfully")
    # Get last lines to show build result
    lines = out.strip().split('\n')
    print(f"Last output: {lines[-1] if lines else 'OK'}")

# Start backend
print("\n4. Starting backend...")
stdin, stdout, stderr = ssh.exec_command(
    "cd /root/virtual-tryon && docker compose -f docker-compose.backend.yml up -d backend 2>&1"
)
print(stdout.read().decode())

# Wait for startup
print("\n5. Waiting 20 seconds for backend to start...")
time.sleep(20)

# Verify
print("\n6. Container status:")
stdin, stdout, stderr = ssh.exec_command("docker ps --format '{{.Names}}\t{{.Status}}'")
print(stdout.read().decode())

print("\n7. Health check:")
stdin, stdout, stderr = ssh.exec_command('docker exec lookitry-backend wget -q -O- "http://localhost:3001/health"')
print(stdout.read().decode()[:500])

print("\n8. Test API endpoints:")
stdin, stdout, stderr = ssh.exec_command('docker exec lookitry-backend wget -q -O- -S "http://localhost:3001/api/auth/register" 2>&1 | grep "HTTP"')
print(stdout.read().decode()[:200])

ssh.close()