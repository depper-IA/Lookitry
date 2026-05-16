import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('31.220.18.39', 22, 'root', 'Travis18456916#')

# Check if .env.production exists
stdin, stdout, stderr = ssh.exec_command('test -f /root/virtual-tryon/backend/.env.production && echo "EXISTS" || echo "NOT FOUND"')
print("Env file:", stdout.read().decode('utf-8', errors='replace').strip())

# Count lines in env file
stdin, stdout, stderr = ssh.exec_command('wc -l /root/virtual-tryon/backend/.env.production')
print("Lines:", stdout.read().decode('utf-8', errors='replace').strip())

# Check if build context exists
stdin, stdout, stderr = ssh.exec_command('ls -la /root/virtual-tryon/backend/')
print("\n=== BACKEND DIR ===")
print(stdout.read().decode('utf-8', errors='replace'))

ssh.close()