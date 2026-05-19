import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('31.220.18.39', 22, 'root', 'Travis18456916#')

# Fetch recent proxy requests from logs
stdin, stdout, stderr = ssh.exec_command('docker logs lookitry-backend --tail 1000 2>&1 | grep -E "img-proxy|imgProxy" | tail -30')
output = stdout.read().decode('utf-8', errors='replace')
print("=== PROXY REQUESTS ===")
print(output if output else "No proxy requests found.")

ssh.close()