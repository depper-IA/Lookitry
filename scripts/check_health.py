import paramiko
import time

HOST = '31.220.18.39'
USER = 'root'
PASS = 'Travis18456916#'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASS, timeout=30)

# Check health multiple times
for i in range(5):
    stdin, stdout, stderr = ssh.exec_command('curl -s -w "\nHTTP: %{http_code}" http://localhost:3001/health', timeout=10)
    result = stdout.read().decode()
    print(f'Attempt {i+1}: {result}')
    if 'HTTP: 200' in result:
        print('Backend is healthy!')
        break
    time.sleep(5)

ssh.close()