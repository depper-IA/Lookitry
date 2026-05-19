import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('31.220.18.39', 22, 'root', 'Travis18456916#')

# Wait for rebuild
import time
time.sleep(30)

# Check backend logs after rebuild
stdin, stdout, stderr = ssh.exec_command('docker logs lookitry-backend --tail 20 2>&1')
output = stdout.read().decode('utf-8', errors='replace')
with open('backend_logs3.txt', 'w', encoding='utf-8') as f:
    f.write(output)

print("Logs saved")
ssh.close()