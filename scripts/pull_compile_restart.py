import paramiko
import os
from dotenv import load_dotenv
import sys
import time

load_dotenv(os.path.join(os.path.dirname(__file__), '../backend/.env'))

HOST = os.getenv("VPS_HOST", "31.220.18.39")
USER = os.getenv("VPS_USER", "root")
PASS = os.getenv("VPS_PASS")
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "")
GITHUB_REPO = os.getenv("GITHUB_REPO", "https://github.com/depper-IA/Lookitry.git")
REPO_URL = GITHUB_REPO.replace("https://", f"https://{GITHUB_TOKEN}@") if GITHUB_TOKEN else GITHUB_REPO

if not PASS:
    sys.exit(1)

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASS, timeout=30)

def run(cmd, timeout=120):
    print(f"\n$ {cmd}")
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode("utf-8", errors="replace")
    err = stderr.read().decode("utf-8", errors="replace")
    if out.strip():
        print(out.strip())
    if err.strip():
        print("[stderr]", err.strip())

# 1. Pull latest code
run(f"cd /root/virtual-tryon && git remote set-url origin {REPO_URL} && git reset --hard HEAD && git pull origin main")

# 2. Compilar TypeScript DENTRO del contenedor usando npm run build local
print("\nCompilando TypeScript dentro del contenedor...")
run("docker exec lookitry-backend sh -c 'cd /app && ./node_modules/.bin/tsc --skipLibCheck 2>&1 | tail -5'", timeout=120)

# 3. Verificar que el nuevo fix este compilado
print("\nVerificando fix...")
stdin3, stdout3, _ = ssh.exec_command(
    "docker exec lookitry-backend sh -c \"grep -c 'response.text' /app/dist/controllers/products.controller.js\""
)
count = stdout3.read().decode("utf-8", errors="replace").strip()
if count and int(count) > 0:
    print(f"FIX CONFIRMADO: response.text encontrado {count} veces en el compilado")
else:
    print("ALERTA: fix no encontrado en compilado")

# 4. Reiniciar
run("cd /root/virtual-tryon && docker compose -f docker-compose.backend.yml restart")
time.sleep(5)

# 5. Estado
run("docker ps --format 'table {{.Names}}\t{{.Status}}'")

ssh.close()
print("\nListo. Prueba la descripcion con IA ahora.")
