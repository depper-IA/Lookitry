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

_, stdout, stderr = ssh.exec_command("cat /root/virtual-tryon/docker_build_frontend.log")
with open("docker_build_frontend.log", "w", encoding="utf-8") as f:
    f.write(stdout.read().decode(errors="replace"))
    f.write(stderr.read().decode(errors="replace"))
ssh.close()
