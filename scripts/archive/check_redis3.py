import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('31.220.18.39', 22, 'root', 'Travis18456916#')

# Try connecting to root-redis-1 from backend
stdin, stdout, stderr = ssh.exec_command('docker exec lookitry-backend sh -c "nc -zv root-redis-1 6379 2>&1 || echo Connection failed"')
print("=== BACKEND->root-redis-1 ===")
print(stdout.read().decode('utf-8', errors='replace'))

# Check if redis port is accessible from host
stdin, stdout, stderr = ssh.exec_command('nc -zv 172.19.0.10 6379 2>&1 || echo Host to Redis failed"')
print("\n=== HOST->REDIS ===")
print(stdout.read().decode('utf-8', errors='replace'))

# Check if Redis is actually listening
stdin, stdout, stderr = ssh.exec_command('docker exec root-redis-1 redis-cli ping 2>&1')
print("\n=== REDIS PING ===")
print(stdout.read().decode('utf-8', errors='replace'))

ssh.close()