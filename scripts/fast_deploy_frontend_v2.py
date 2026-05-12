import os, paramiko
host, user, psw = '31.220.18.39', 'root', 'Travis18456916#'
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(host, username=user, password=psw)
# Restart frontend directly
stdin, stdout, stderr = ssh.exec_command('cd /root/virtual-tryon && git pull origin main')
print("PULL:", stdout.read().decode())
print("PULL ERR:", stderr.read().decode())
stdin, stdout, stderr = ssh.exec_command('cd /root/virtual-tryon && docker compose -f docker-compose.frontend.yml up -d --build')
print("BUILD:", stdout.read().decode())
print("BUILD ERR:", stderr.read().decode())
