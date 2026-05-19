import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('31.220.18.39', 22, 'root', 'Travis18456916#')

# Check docker-compose.backend.yml
stdin, stdout, stderr = ssh.exec_command('cat /root/virtual-tryon/docker-compose.backend.yml | head -80')
print("=== docker-compose.backend.yml ===")
print(stdout.read().decode('utf-8', errors='replace'))

ssh.close()