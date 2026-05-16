import paramiko
import subprocess

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('31.220.18.39', 22, 'root', 'Travis18456916#')

# Check health
stdin, stdout, stderr = ssh.exec_command('curl -s https://api.lookitry.com/health')
print("=== API HEALTH ===")
output = stdout.read().decode('utf-8', errors='replace')
print(output[:500])

# Check Redis status
stdin, stdout, stderr = ssh.exec_command('docker ps --filter name=redis --format "{{.Names}}: {{.Status}}"')
print("\n=== REDIS STATUS ===")
print(stdout.read().decode('utf-8', errors='replace'))

# Check if backend can connect to Redis
stdin, stdout, stderr = ssh.exec_command('docker exec lookitry-backend sh -c "nc -zv redis 6379 2>&1 || echo Connection failed"')
print("\n=== BACKEND->REDIS CONNECTION ===")
print(stdout.read().decode('utf-8', errors='replace'))

ssh.close()