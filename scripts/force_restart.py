import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('31.220.18.39', 22, 'root', 'Travis18456916#')

# Force stop and remove old container, then start fresh
print("Force rebuilding backend...")
ssh.exec_command('cd /root/virtual-tryon && docker compose -f docker-compose.backend.yml down --remove-orphans')
ssh.exec_command('cd /root/virtual-tryon && docker compose -f docker-compose.backend.yml up -d')

ssh.close()

import time
time.sleep(20)

# Check container env
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('31.220.18.39', 22, 'root', 'Travis18456916#')

stdin, stdout, stderr = ssh.exec_command('docker exec lookitry-backend sh -c "echo \\$REDIS_URL"')
print("\nContainer REDIS_URL:", stdout.read().decode('utf-8', errors='replace').strip())

# Get logs
stdin, stdout, stderr = ssh.exec_command('docker logs lookitry-backend --tail 10 2>&1')
print("\nRecent logs:", stdout.read().decode('utf-8', errors='replace').strip())

ssh.close()