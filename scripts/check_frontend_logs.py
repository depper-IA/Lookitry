import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('31.220.18.39', 22, 'root', 'Travis18456916#')

# Fetch recent proxy requests from frontend logs
stdin, stdout, stderr = ssh.exec_command('docker logs lookitry-frontend --tail 1000 2>&1 | grep -E "img-proxy|error|Error|403" | tail -30')
output = stdout.read().decode('utf-8', errors='replace')
print("=== FRONTEND LOGS ===")
print(output if output else "No errors found.")

ssh.close()