import paramiko
import os
from dotenv import load_dotenv
import sys

load_dotenv(os.path.join(os.path.dirname(__file__), '../backend/.env'))

HOST = os.getenv("VPS_HOST", "31.220.18.39")
USER = os.getenv("VPS_USER", "root")
PASS = os.getenv("VPS_PASS")

if not PASS:
    print("Error: VPS_PASS no esta definida.")
    sys.exit(1)

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASS, timeout=30)

# Logs recientes del backend - todo lo relacionado IA o products
stdin, stdout, stderr = ssh.exec_command("docker logs --tail 30 lookitry-backend 2>&1")
print(stdout.read().decode(errors="replace"))

ssh.close()
