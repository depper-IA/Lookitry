import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('31.220.18.39', 22, 'root', 'Travis18456916#')

# Check if there's rate limiting on pruebalo endpoint
# First, let's see the recent requests and if there's a pattern

# Check Redis rate limit keys
stdin, stdout, stderr = ssh.exec_command('docker exec root-redis-1 redis-cli KEYS "*ratelimit*" 2>&1 | head -20')
print("=== RATE LIMIT KEYS ===")
print(stdout.read().decode('utf-8', errors='replace'))

# Try to flush rate limits (testing only)
stdin, stdout, stderr = ssh.exec_command('docker exec root-redis-1 redis-cli FLUSHDB 2>&1')
print("\n=== FLUSHED REDIS ===")
print(stdout.read().decode('utf-8', errors='replace'))

ssh.close()