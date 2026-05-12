import os, paramiko
host, user, psw = '31.220.18.39', 'root', 'Travis18456916#'
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(host, username=user, password=psw)
# Check docker ps and git log
stdin, stdout, stderr = ssh.exec_command('docker ps --filter "name=frontend" && cd /root/virtual-tryon && git log -1 --oneline')
print(stdout.read().decode('utf-8', errors='ignore'))
print(stderr.read().decode('utf-8', errors='ignore'))
