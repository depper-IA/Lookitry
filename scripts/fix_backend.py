import paramiko
import os
from dotenv import load_dotenv

load_dotenv(r"c:\Users\Matt\Lookitry\backend\.env")

HOST = os.getenv("VPS_HOST", "31.220.18.39")
USER = os.getenv("VPS_USER", "root")
PASS = os.getenv("VPS_PASS")
REPO = "/root/virtual-tryon"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASS, timeout=30)

def run(cmd):
    print(f"\n$ {cmd}")
    _, stdout, stderr = ssh.exec_command(cmd)
    print(stdout.read().decode())
    print(stderr.read().decode())

run(f"cd {REPO} && docker compose -f docker-compose.backend.yml down")
run(f"cd {REPO} && docker compose -f docker-compose.backend.yml up -d --force-recreate")
run("docker ps -a")

ssh.close()
