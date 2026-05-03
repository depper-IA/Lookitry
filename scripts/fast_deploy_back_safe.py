import os, paramiko
host, user, psw = '31.220.18.39', 'root', 'Travis18456916#'
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(host, username=user, password=psw)

stdin, stdout, stderr = ssh.exec_command('cd /root/virtual-tryon && git pull origin main')
print("PULL OUT:", stdout.read().decode())
print("PULL ERR:", stderr.read().decode())

# Deploy backend directly, we can read stdout
stdin, stdout, stderr = ssh.exec_command('cd /root/virtual-tryon && docker compose -f docker-compose.backend.yml up -d --build')

import sys
import codecs
sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')

while True:
    line = stdout.readline()
    if not line:
        break
    sys.stdout.write(line)
    sys.stdout.flush()
    
err = stderr.read().decode('utf-8', errors='ignore')
if err:
    print("ERR:", err)
