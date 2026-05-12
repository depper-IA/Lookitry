import os, paramiko
host, user, psw = '31.220.18.39', 'root', 'Travis18456916#'
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(host, username=user, password=psw)

# Fire and forget
command = 'cd /root/virtual-tryon && nohup docker compose -f docker-compose.frontend.yml up -d --build > deploy_front_final.txt 2>&1 &'
ssh.exec_command(command)
print("Deploying frontend in background. It will take ~3 minutes.")
