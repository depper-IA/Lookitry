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

# Ver imagenes y sus tiempos de creacion
stdin, stdout, stderr = ssh.exec_command("docker images | grep backend")
print(stdout.read().decode(errors="replace"))

# Ver que imagen esta usando el contenedor exactamente
stdin2, stdout2, stderr2 = ssh.exec_command("docker inspect lookitry-backend --format '{{.Image}}'")
print("Image ID in use:", stdout2.read().decode(errors="replace").strip())

ssh.close()
