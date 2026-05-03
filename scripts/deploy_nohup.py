import os, paramiko
host, user, psw = '31.220.18.39', 'root', 'Travis18456916#'
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(host, username=user, password=psw)

command = 'cd /root/virtual-tryon && git pull origin main && nohup docker compose -f docker-compose.frontend.yml up -d --build > deploy_log_front.txt 2>&1 &'
ssh.exec_command(command)
print("Deploying frontend with nohup...")
