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

print("=== Adding REDIS_URL to .env.production ===")

# Read current .env.production
stdin, stdout, stderr = ssh.exec_command("cat /root/virtual-tryon/backend/.env.production")
current_env = stdout.read().decode()
print("Current .env.production:")
print(current_env)

# Add REDIS_URL if not present
if 'REDIS_URL' not in current_env:
    new_env = current_env.strip() + '\nREDIS_URL=redis://root-redis-1:6379\n'
    print("\nNew .env.production with REDIS_URL:")
    print(new_env)

    # Write new .env.production using a heredoc
    # First backup original
    ssh.exec_command("cp /root/virtual-tryon/backend/.env.production /root/virtual-tryon/backend/.env.production.bak")

    # Write new file
    cmd = f'cat > /root/virtual-tryon/backend/.env.production << \'EOF\\n{new_env}EOF'
    stdin2, stdout2, stderr2 = ssh.exec_command(cmd)
    print("\nWrite result:", stdout2.read().decode())

    # Verify
    stdin, stdout, stderr = ssh.exec_command("cat /root/virtual-tryon/backend/.env.production")
    print("\nVerified .env.production:")
    print(stdout.read().decode())
else:
    print("REDIS_URL already present!")

print("\n=== Rebuilding and restarting backend ===")

# Stop and remove backend
ssh.exec_command("docker stop lookitry-backend && docker rm lookitry-backend")
print("Stopped and removed old backend")

# Rebuild
stdin, stdout, stderr = ssh.exec_command(
    "cd /root/virtual-tryon && docker compose -f docker-compose.backend.yml build backend 2>&1",
    timeout=300
)
out = stdout.read().decode()
err = stderr.read().decode()
if 'error' in out.lower() or 'error' in err.lower():
    print("Build errors:")
    print(out)
    print(err)
else:
    print("Backend built successfully")

# Start backend
stdin, stdout, stderr = ssh.exec_command(
    "cd /root/virtual-tryon && docker compose -f docker-compose.backend.yml up -d backend 2>&1"
)
print("Start result:", stdout.read().decode())

# Wait for backend to start
print("\nWaiting 15 seconds for backend to initialize...")
time.sleep(15)

# Check status
print("\n=== Final status ===")
stdin, stdout, stderr = ssh.exec_command("docker ps --format '{{.Names}}\t{{.Status}}'")
print(stdout.read().decode())

# Test health
print("\n=== Health check ===")
stdin, stdout, stderr = ssh.exec_command("docker exec lookitry-backend wget -q -O- http://localhost:3001/health")
print(stdout.read().decode())

ssh.close()