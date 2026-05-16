import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('31.220.18.39', 22, 'root', 'Travis18456916#')

# Get backend logs
stdin, stdout, stderr = ssh.exec_command('docker logs lookitry-backend --tail 50 2>&1 | tail -50')
print("=== BACKEND LOGS (last 50) ===")
print(stdout.read().decode('utf-8', errors='replace'))
print(stderr.read().decode('utf-8', errors='replace'))

ssh.close()