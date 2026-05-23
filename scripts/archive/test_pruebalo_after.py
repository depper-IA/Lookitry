import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('31.220.18.39', 22, 'root', 'Travis18456916#')

# Try the endpoint again after flush
stdin, stdout, stderr = ssh.exec_command('curl -s -o /dev/null -w "%{http_code}" "http://localhost:3001/api/pruebalo/wilkie-devs"')
print("Pruebalo status after flush:", stdout.read().decode('utf-8', errors='replace').strip())

# Get full response
stdin, stdout, stderr = ssh.exec_command('curl -s "http://localhost:3001/api/pruebalo/wilkie-devs" | head -c 500')
print("\nResponse:", stdout.read().decode('utf-8', errors='replace').strip())

ssh.close()