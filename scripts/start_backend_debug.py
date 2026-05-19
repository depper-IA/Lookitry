import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('31.220.18.39', 22, 'root', 'Travis18456916#')

# Check if the env file exists and has correct content
stdin, stdout, stderr = ssh.exec_command('ls -la /root/virtual-tryon/backend/.env.production')
print("=== ENV FILE ===")
print(stdout.read().decode('utf-8', errors='replace'))

# Show only REDIS lines
stdin, stdout, stderr = ssh.exec_command('cat /root/virtual-tryon/backend/.env.production | grep -E "^REDIS"')
print("\n=== REDIS CONFIG ===")
print(stdout.read().decode('utf-8', errors='replace'))

# Try to start manually with more output
print("\n=== STARTING BACKEND ===")
stdin, stdout, stderr = ssh.exec_command('cd /root/virtual-tryon && docker compose -f docker-compose.backend.yml up 2>&1')
output = stdout.read().decode('utf-8', errors='replace')
err = stderr.read().decode('utf-8', errors='replace')
print(output[:2000])
print(err[:2000])

ssh.close()