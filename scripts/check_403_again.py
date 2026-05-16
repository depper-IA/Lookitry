import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('31.220.18.39', 22, 'root', 'Travis18456916#')

# Check backend logs for 403 errors again to see the IP or headers
stdin, stdout, stderr = ssh.exec_command('docker logs lookitry-backend --tail 500 2>&1 | grep -C 2 "403" | tail -30')
output = stdout.read().decode('utf-8', errors='replace')
print("=== RECENT 403 LOGS ===")
print(output if output else "No recent 403 logs found.")

ssh.close()