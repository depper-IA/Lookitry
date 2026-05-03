import os, paramiko
host, user, psw = '31.220.18.39', 'root', 'Travis18456916#'
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(host, username=user, password=psw)
# Use a background process for building and log output
command = 'cd /root/virtual-tryon && git pull origin main && docker compose -f docker-compose.frontend.yml up -d --build > deploy_log.txt 2>&1 &'
ssh.exec_command(command)
print("Build launched in background. Check deploy_log.txt on VPS for status.")
