import paramiko
import os
from dotenv import load_dotenv
import sys
import time

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

# Reiniciar solo el contenedor para que tome los cambios compilados
print("Reiniciando contenedor backend...")
stdin, stdout, stderr = ssh.exec_command(
    "cd /root/virtual-tryon && docker compose -f docker-compose.backend.yml restart"
)
time.sleep(6)
print(stdout.read().decode(errors="replace"))

# Verificar que sigue corriendo
stdin2, stdout2, _ = ssh.exec_command("docker ps --format 'table {{.Names}}\t{{.Status}}'")
print(stdout2.read().decode(errors="replace"))

ssh.close()
