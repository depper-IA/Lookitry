import paramiko
import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "../backend/.env"))

HOST = "31.220.18.39"
USER = "root"
PASSWORD = os.environ.get("VPS_PASS", "Travis18456916#")

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASSWORD, timeout=10)

stdin, stdout, stderr = ssh.exec_command("tail -n 50 /root/virtual-tryon/docker_build_sam.log")
with open("build_log_tail.txt", "w", encoding="utf-8") as f:
    f.write(stdout.read().decode('utf-8', 'replace'))
ssh.close()

