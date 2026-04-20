import paramiko
import os
import sys

# Read the SSH key
key_path = os.path.join(os.path.dirname(__file__), "id_rsa_lookitry")
with open(key_path, 'r') as f:
    key_content = f.read()

# Create SSH key object
from io import StringIO
key_file = StringIO(key_content)
key = paramiko.RSAKey.from_private_key(key_file)

# Connect to VPS
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

print("Connecting to 31.220.18.39...")
ssh.connect(hostname="31.220.18.39", username="root", pkey=key, timeout=15)

print("Connected! Running commands...\n")

# List containers
print("=== Docker Containers ===")
stdin, stdout, stderr = ssh.exec_command("docker ps -a --format '{{.Names}}\t{{.Status}}\t{{.Image}}'")
print(stdout.read().decode())

# Check backend logs
print("\n=== Backend Logs (last 20 lines) ===")
stdin, stdout, stderr = ssh.exec_command("docker logs --tail 20 lookitry-backend 2>&1")
print(stdout.read().decode())
print(stderr.read().decode())

# Check what files exist in /root/virtual-tryon
print("\n=== /root/virtual-tryon directory ===")
stdin, stdout, stderr = ssh.exec_command("ls -la /root/virtual-tryon/")
print(stdout.read().decode())

# Check if backend code exists
print("\n=== Backend directory ===")
stdin, stdout, stderr = ssh.exec_command("ls -la /root/virtual-tryon/backend/ 2>&1 | head -20")
print(stdout.read().decode())

ssh.close()
print("\nDone!")