import os
import paramiko
from dotenv import load_dotenv

load_dotenv("/home/travis/Lookitry/Lookitry/backend/.env")

HOST = "31.220.18.39"
USER = "root"
PASS = os.getenv("VPS_PASS")

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASS)

def run(cmd):
    print(f"\n==== {cmd} ====")
    stdin, stdout, stderr = ssh.exec_command(cmd)
    print(stdout.read().decode())
    err = stderr.read().decode()
    if err:
        print("[stderr]", err)

run("uptime")
run("free -m")
run("df -h /")
run("docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'")

ssh.close()
