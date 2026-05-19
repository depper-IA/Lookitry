import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('31.220.18.39', 22, 'root', 'Travis18456916#')

# Test Redis connection with password from backend
stdin, stdout, stderr = ssh.exec_command('docker exec root-redis-1 redis-cli -a Redis2024SecurePassNoSlash ping 2>&1')
print("=== REDIS AUTH TEST ===")
print(stdout.read().decode('utf-8', errors='replace'))

# Check Redis config for requirepass
stdin, stdout, stderr = ssh.exec_command('docker exec root-redis-1 redis-cli CONFIG GET requirepass 2>&1')
print("\n=== REDIS REQUIREPASS ===")
print(stdout.read().decode('utf-8', errors='replace'))

ssh.close()