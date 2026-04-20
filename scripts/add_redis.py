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

print("=== Appending REDIS_URL using echo ===")

# Use printf with redirection to append
cmd = 'printf "\\nREDIS_URL=redis://root-redis-1:6379\\n" >> /root/virtual-tryon/backend/.env.production'
stdin, stdout, stderr = ssh.exec_command(cmd)
print("Append result:", stdout.read().decode(), stderr.read().decode())

# Verify
print("\n=== Verifying ===")
stdin, stdout, stderr = ssh.exec_command('tail -5 /root/virtual-tryon/backend/.env.production')
print(stdout.read().decode())

# Also need to update docker-compose.backend.yml to pass REDIS_URL as environment variable directly
# since env_file might have issues with variable expansion
print("\n=== Updating docker-compose.backend.yml with REDIS_URL ===")

# Read current compose file
stdin, stdout, stderr = ssh.exec_command('cat /root/virtual-tryon/docker-compose.backend.yml')
compose_content = stdout.read().decode()
print("Current compose file:")
print(compose_content)

# Check if it already has REDIS_URL in environment
if 'REDIS_URL' not in compose_content:
    # Add REDIS_URL environment variable
    new_compose = compose_content.replace(
        'environment:\n      - NODE_OPTIONS=--max-old-space-size=512',
        'environment:\n      - NODE_OPTIONS=--max-old-space-size=512\n      - REDIS_URL=redis://root-redis-1:6379'
    )

    # Write new compose file
    cmd = f'cat > /root/virtual-tryon/docker-compose.backend.yml << \'ENDOFFILE\\n{new_compose}ENDOFFILE'
    stdin, stdout, stderr = ssh.exec_command(cmd)
    print("\nWrite compose result:", stdout.read().decode(), stderr.read().decode())

    # Verify
    stdin, stdout, stderr = ssh.exec_command('cat /root/virtual-tryon/docker-compose.backend.yml')
    print("\nNew compose file:")
    print(stdout.read().decode())
else:
    print("REDIS_URL already in compose file")

ssh.close()