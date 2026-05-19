import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('31.220.18.39', 22, 'root', 'Travis18456916#')

# Check .env.production for REDIS
stdin, stdout, stderr = ssh.exec_command('cat /root/virtual-tryon/backend/.env.production | grep -i redis')
print("=== REDIS in .env.production ===")
print(stdout.read().decode('utf-8', errors='replace'))

ssh.close()