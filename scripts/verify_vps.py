import os
import paramiko
from dotenv import load_dotenv

# Use absolute path to avoid confusion
load_dotenv("c:/Users/Matt/Lookitry/backend/.env")

HOST = "31.220.18.39"
USER = "root"
PASS = os.getenv("VPS_PASS")

if not PASS:
    print("Error: VPS_PASS not in env")
    exit(1)

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASS)

def run(cmd):
    print(f"\n$ {cmd}")
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode(errors="replace")
    err = stderr.read().decode(errors="replace")
    if out: print(out)
    if err: print("[stderr]", err)

run("docker ps -a --filter name=lookitry-backend")
run("docker logs lookitry-backend --tail 50")
run("docker inspect -f '{{.State.Status}} {{.State.RestartCount}}' lookitry-backend")

ssh.close()
