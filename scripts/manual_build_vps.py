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

# Correr build manualmente en el VPS
print("Corriendo npm run build en el VPS...")
stdin, stdout, stderr = ssh.exec_command("cd /root/virtual-tryon/backend && npm run build")
print(stdout.read().decode(errors="replace"))
print(stderr.read().decode(errors="replace"))

# Reiniciar el contenedor
print("Reiniciando contenedor...")
ssh.exec_command("cd /root/virtual-tryon && docker compose -f docker-compose.backend.yml restart")

ssh.close()
