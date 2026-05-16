import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('31.220.18.39', 22, 'root', 'Travis18456916#')

# Check what REDIS_HOST env var is set in backend
stdin, stdout, stderr = ssh.exec_command('docker exec lookitry-backend sh -c "echo \\$REDIS_HOST"')
print("=== REDIS_HOST env ===")
print(stdout.read().decode('utf-8', errors='replace'))

# Check if there's a redis.conf or env variable for REDIS_URL
stdin, stdout, stderr = ssh.exec_command('docker exec lookitry-backend sh -c "env | grep -i redis"')
print("\n=== REDIS env vars ===")
print(stdout.read().decode('utf-8', errors='replace'))

ssh.close()