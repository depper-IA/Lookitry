import paramiko
import os
from dotenv import load_dotenv

load_dotenv("backend/.env")

HOST = os.getenv("VPS_HOST", "31.220.18.39")
USER = os.getenv("VPS_USER", "root")
PASS = os.getenv("VPS_PASS", "Travis18456916#")

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASS)

stdin, stdout, stderr = ssh.exec_command("cd /root/virtual-tryon && docker compose -f docker-compose.backend.yml down && docker compose -f docker-compose.backend.yml up -d --force-recreate")
print("STDOUT:")
print(stdout.read().decode('utf-8'))
print("STDERR:")
print(stderr.read().decode('utf-8'))
print("STDERR:")
print(stderr.read().decode('utf-8'))

ssh.close()
