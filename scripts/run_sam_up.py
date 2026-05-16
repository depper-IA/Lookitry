import paramiko
import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "../backend/.env"))

HOST = "31.220.18.39"
USER = "root"
PASS = os.environ.get("VPS_PASS", "Travis18456916#")

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASS, timeout=30)

stdin, stdout, stderr = ssh.exec_command("cd /root/virtual-tryon && docker compose -f vps-docker-compose.yml up sam-local")
print(stdout.read().decode())
print(stderr.read().decode())
ssh.close()
