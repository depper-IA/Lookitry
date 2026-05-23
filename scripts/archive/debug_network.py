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

print("=== Container Network Configuration ===")

# Check networks
print("1. Backend network:")
stdin, stdout, stderr = ssh.exec_command('docker inspect lookitry-backend --format "{{json .NetworkSettings.Networks}}" | python3 -m json.tool')
print(stdout.read().decode())

print("\n2. Frontend network:")
stdin, stdout, stderr = ssh.exec_command('docker inspect lookitry-frontend --format "{{json .NetworkSettings.Networks}}" | python3 -m json.tool')
print(stdout.read().decode())

print("\n3. Traefik network:")
stdin, stdout, stderr = ssh.exec_command('docker inspect traefik --format "{{json .NetworkSettings.Networks}}" | python3 -m json.tool')
print(stdout.read().decode())

print("\n4. Traefik recent logs:")
stdin, stdout, stderr = ssh.exec_command('docker logs --tail 30 traefik 2>&1')
print(stdout.read().decode())

print("\n5. Traefik connected networks:")
stdin, stdout, stderr = ssh.exec_command('docker network inspect proxy --format "{{json .Containers}}" | python3 -m json.tool 2>/dev/null | head -30')
print(stdout.read().decode()[:500])

ssh.close()