import os, paramiko
host, user, psw = '31.220.18.39', 'root', 'Travis18456916#'
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(host, username=user, password=psw)

print("Deploying backend...")
stdin, stdout, stderr = ssh.exec_command('cd /root/virtual-tryon && docker compose -f docker-compose.backend.yml up -d --build')
for line in stdout: print(line.strip())
for line in stderr: print(line.strip())

print("Deploying frontend...")
stdin, stdout, stderr = ssh.exec_command('cd /root/virtual-tryon && docker compose -f docker-compose.frontend.yml up -d --build')
for line in stdout: print(line.strip())
for line in stderr: print(line.strip())
