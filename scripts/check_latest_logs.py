import paramiko
import os
from dotenv import load_dotenv
import sys

load_dotenv(os.path.join(os.path.dirname(__file__), '../backend/.env'))

HOST = os.getenv("VPS_HOST", "31.220.18.39")
USER = os.getenv("VPS_USER", "root")
PASS = os.getenv("VPS_PASS")

if not PASS:
    sys.exit(1)

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASS, timeout=30)

# Grep logs por AI-Descriptor
stdin, stdout, _ = ssh.exec_command("docker logs --tail 50 lookitry-backend 2>&1 | grep -i 'AI-Descri'")
result = stdout.read().decode("utf-8", errors="replace")
print("=== AI-Descriptor logs ===")
print(result if result else "(no logs found)")

ssh.close()
