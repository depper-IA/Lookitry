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

# Manually remove container
print("Removiendo contenedor conflictivo...")
ssh.exec_command("docker rm -f lookitry-backend")

# Up
print("Lanzando backend...")
stdin, stdout, stderr = ssh.exec_command("cd /root/virtual-tryon && docker compose -f docker-compose.backend.yml up -d")
print(stdout.read().decode(errors="replace"))
print(stderr.read().decode(errors="replace"))

# Confirmar nueva imagen en uso
stdin2, stdout2, stderr2 = ssh.exec_command("docker inspect lookitry-backend --format '{{.Image}}'")
img_id = stdout2.read().decode(errors="replace").strip()
print("Nueva Image ID en uso:", img_id)

# Ver logs iniciales para confirmar version
print("\nPrimeas lineas de log:")
stdin3, stdout3, _ = ssh.exec_command("docker logs lookitry-backend 2>&1 | head -n 10")
print(stdout3.read().decode(errors="replace"))

ssh.close()
