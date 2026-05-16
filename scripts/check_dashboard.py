import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('31.220.18.39', 22, 'root', 'Travis18456916#')

# Check health
stdin, stdout, stderr = ssh.exec_command('curl -s https://api.lookitry.com/health')
print("=== API HEALTH ===")
print(stdout.read().decode())

# Check backend logs
stdin, stdout, stderr = ssh.exec_command('docker logs lookitry-backend --tail 30 2>&1')
print("\n=== BACKEND LOGS ===")
print(stdout.read().decode())
print(stderr.read().decode())

# Check frontend logs
stdin, stdout, stderr = ssh.exec_command('docker logs lookitry-frontend --tail 20 2>&1')
print("\n=== FRONTEND LOGS ===")
print(stdout.read().decode())

ssh.close()