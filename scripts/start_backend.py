import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('31.220.18.39', 22, 'root', 'Travis18456916#')

# Start the backend service
print("Starting backend service...")
ssh.exec_command('cd /root/virtual-tryon && docker compose -f docker-compose.backend.yml up -d')

ssh.close()

import time
time.sleep(30)

# Check status
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('31.220.18.39', 22, 'root', 'Travis18456916#')

stdin, stdout, stderr = ssh.exec_command('docker ps --format "{{.Names}}: {{.Status}}"')
print("\n=== RUNNING CONTAINERS ===")
print(stdout.read().decode('utf-8', errors='replace'))

ssh.close()