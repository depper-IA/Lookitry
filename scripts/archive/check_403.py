import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('31.220.18.39', 22, 'root', 'Travis18456916#')

# Check backend logs for 403 errors
stdin, stdout, stderr = ssh.exec_command('docker logs lookitry-backend --tail 50 2>&1')
output = stdout.read().decode('utf-8', errors='replace')
with open('backend_logs_403.txt', 'w', encoding='utf-8') as f:
    f.write(output)

# Test the pruebalo endpoint
stdin, stdout, stderr = ssh.exec_command('curl -s -o /dev/null -w "%{http_code}" "http://localhost:3001/api/pruebalo/wilkie-devs"')
print("\nPruebalo endpoint status:", stdout.read().decode('utf-8', errors='replace').strip())

# Test health
stdin, stdout, stderr = ssh.exec_command('curl -s "http://localhost:3001/health" | head -c 200')
print("Health:", stdout.read().decode('utf-8', errors='replace').strip())

ssh.close()