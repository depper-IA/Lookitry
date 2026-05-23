import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('31.220.18.39', 22, 'root', 'Travis18456916#')

# Check full docker-compose.backend.yml
stdin, stdout, stderr = ssh.exec_command('cat /root/virtual-tryon/docker-compose.backend.yml')
print("=== docker-compose.backend.yml ===")
print(stdout.read().decode('utf-8', errors='replace'))

# Try running with verbose
stdin, stdout, stderr = ssh.exec_command('cd /root/virtual-tryon && docker compose -f docker-compose.backend.yml up -d --verbose 2>&1 | head -50')
print("\n=== VERBOSE OUTPUT ===")
print(stdout.read().decode('utf-8', errors='replace'))
print(stderr.read().decode('utf-8', errors='replace'))

ssh.close()