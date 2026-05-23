import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('31.220.18.39', 22, 'root', 'Travis18456916#')

# Check Redis container network
stdin, stdout, stderr = ssh.exec_command('docker inspect root-redis-1 --format "{{json .NetworkSettings.Networks}}" | python3 -m json.tool 2>/dev/null || docker inspect root-redis-1 --format "{{.NetworkSettings.Networks}}"')
print("=== REDIS NETWORKS ===")
print(stdout.read().decode('utf-8', errors='replace'))

# Check backend container network
stdin, stdout, stderr = ssh.exec_command('docker inspect lookitry-backend --format "{{json .NetworkSettings.Networks}}" | python3 -m json.tool 2>/dev/null || docker inspect lookitry-backend --format "{{.NetworkSettings.Networks}}"')
print("\n=== BACKEND NETWORKS ===")
print(stdout.read().decode('utf-8', errors='replace'))

# Check docker networks
stdin, stdout, stderr = ssh.exec_command('docker network ls --format "{{.Name}}"')
print("\n=== DOCKER NETWORKS ===")
print(stdout.read().decode('utf-8', errors='replace'))

# Check what hostname redis resolves to from backend
stdin, stdout, stderr = ssh.exec_command('docker exec lookitry-backend sh -c "getent hosts redis 2>/dev/null || cat /etc/hosts | grep redis"')
print("\n=== /etc/hosts on backend for redis ===")
print(stdout.read().decode('utf-8', errors='replace'))

ssh.close()