import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('31.220.18.39', 22, 'root', 'Travis18456916#')

# Get recent backend logs
stdin, stdout, stderr = ssh.exec_command('docker logs lookitry-backend --tail 30 2>&1')
output = stdout.read().decode('utf-8', errors='replace')
with open('backend_logs2.txt', 'w', encoding='utf-8') as f:
    f.write(output)

print("Logs saved")
ssh.close()