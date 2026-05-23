import os, paramiko, time
host, user, psw = '31.220.18.39', 'root', 'Travis18456916#'
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(host, username=user, password=psw)

print("Deploying both backend and frontend...")
# Pull and start building both
command = 'cd /root/virtual-tryon && git pull origin main && docker compose -f docker-compose.backend.yml up -d --build && docker compose -f docker-compose.frontend.yml up -d --build > deploy_log.txt 2>&1 &'
ssh.exec_command(command)
print("Build launched in background.")
