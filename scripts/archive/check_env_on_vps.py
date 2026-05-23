import paramiko
from io import StringIO

# Read the SSH key
key_path = "scripts/id_rsa_lookitry"
with open(key_path, 'r') as f:
    key_content = f.read()

key_file = StringIO(key_content)
key = paramiko.RSAKey.from_private_key(key_file)

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(hostname="31.220.18.39", username="root", pkey=key, timeout=15)

# Check current .env.production content
print("=== Current .env.production on VPS ===")
stdin, stdout, stderr = ssh.exec_command("cat /root/virtual-tryon/backend/.env.production")
print(stdout.read().decode())

print("\n=== Checking docker-compose.backend.yml for env vars ===")
stdin, stdout, stderr = ssh.exec_command("cat /root/virtual-tryon/docker-compose.backend.yml")
print(stdout.read().decode())

ssh.close()