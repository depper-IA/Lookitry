import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('31.220.18.39', 22, 'root', 'Travis18456916#')

# Get recent logs with widgetSecurity prefix
stdin, stdout, stderr = ssh.exec_command('docker logs lookitry-backend --tail 100 2>&1 | grep widgetSecurity | tail -20')
output = stdout.read().decode('utf-8', errors='replace')
print("=== WIDGET SECURITY LOGS ===")
print(output if output else "No logs found with 'widgetSecurity'")

ssh.close()