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
ssh.connect(HOST, username=USER, password=PASS, timeout=60)

# Compilar TypeScript dentro del contenedor
print("Compilando TypeScript dentro del contenedor del backend...")
stdin, stdout, stderr = ssh.exec_command(
    "docker exec lookitry-backend sh -c 'cd /app && npx tsc --skipLibCheck 2>&1 | tail -20'",
    timeout=120
)
print(stdout.read().decode(errors="replace"))
print(stderr.read().decode(errors="replace"))

# Verificar que el fix ya esta compilado
stdin2, stdout2, stderr2 = ssh.exec_command(
    "docker exec lookitry-backend sh -c \"grep 'Proxying external URL' /app/dist/controllers/products.controller.js\""
)
result = stdout2.read().decode(errors="replace")
if result:
    print("FIX confirmado en dist compilado:")
    print(result)
else:
    print("El fix NO se encontro despues de compilar")

ssh.close()
