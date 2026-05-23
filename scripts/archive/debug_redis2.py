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

print("=== Checking REDIS_URL in container ===")
stdin, stdout, stderr = ssh.exec_command('docker exec lookitry-backend sh -c "echo REDIS_URL=$REDIS_URL"')
print(stdout.read().decode())

print("\n=== Checking all env vars with REDIS ===")
stdin, stdout, stderr = ssh.exec_command('docker exec lookitry-backend env')
output = stdout.read().decode()
for line in output.split('\n'):
    if 'redis' in line.lower() or 'REDIS' in line:
        print(line)

print("\n=== /etc/hosts in backend ===")
stdin, stdout, stderr = ssh.exec_command('docker exec lookitry-backend cat /etc/hosts')
print(stdout.read().decode())

print("\n=== nslookup root-redis-1 from backend ===")
stdin, stdout, stderr = ssh.exec_command('docker exec lookitry-backend sh -c "nslookup root-redis-1 2>/dev/null || getent hosts root-redis-1"')
print(stdout.read().decode())

print("\n=== Try redis-cli directly ===")
stdin, stdout, stderr = ssh.exec_command('docker exec root-redis-1 redis-cli ping')
print(stdout.read().decode())

ssh.close()