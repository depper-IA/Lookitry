import paramiko
import os
from dotenv import load_dotenv
import sys

# Cargar variables de entorno desde el .env del backend
load_dotenv(os.path.join(os.path.dirname(__file__), '../backend/.env'))

HOST = os.getenv("VPS_HOST", "31.220.18.39")
USER = os.getenv("VPS_USER", "root")
PASS = os.getenv("VPS_PASS")

if not PASS:
    print("Error: La variable VPS_PASS no está definida.")
    sys.exit(1)

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASS, timeout=30)

# Buscar todos los Dockerfiles (ignorar mayúsculas)
stdin, stdout, stderr = ssh.exec_command("find /root/virtual-tryon -iname 'dockerfile*'")
print(stdout.read().decode(errors="replace"))

ssh.close()
