"""
Deploy script -- virtual-tryon
Uso:
  python _deploy_now.py              -> rebuild solo lo que cambio (rapido, usa cache Docker)
  python _deploy_now.py --no-cache   -> rebuild completo sin cache (lento, para cambios en deps)
  python _deploy_now.py --backend    -> solo backend
  python _deploy_now.py --frontend   -> solo frontend
  python _deploy_now.py --restart    -> solo reinicia contenedores SIN rebuild (~5s, instantaneo)

Tiempos aproximados:
  --restart   : ~5s   (solo reinicia, sin rebuild -- util para cambios de config/env)
  normal      : ~2min frontend, ~1min backend (con cache Docker)
  --no-cache  : ~5min (rebuild completo, solo cuando cambian package.json/deps)
"""
import paramiko
import time
import sys
import os
from dotenv import load_dotenv

# Cargar variables de entorno desde el .env del backend
load_dotenv(os.path.join(os.path.dirname(__file__), '../backend/.env'))

HOST = os.getenv("VPS_HOST", "31.220.18.39")
USER = os.getenv("VPS_USER", "root")
PASS = os.getenv("VPS_PASS")

if not PASS:
    print("Error: La variable VPS_PASS no está definida en el archivo .env del backend.")
    sys.exit(1)

args = sys.argv[1:]
no_cache     = "--no-cache" in args
only_back    = "--backend"  in args
only_front   = "--frontend" in args
restart_only = "--restart"  in args
do_backend   = only_back  or (not only_front)
do_frontend  = only_front or (not only_back)

build_flag = "--no-cache" if no_cache else ""

def run(ssh, cmd, timeout=300):
    print(f"\n$ {cmd}")
    _, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode(errors="replace")
    err = stderr.read().decode(errors="replace")
    if out.strip():
        print(out.strip())
    if err.strip():
        print("[stderr]", err.strip())
    return out, err

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASS, timeout=30)
print(f"Conectado al VPS  [no-cache={no_cache}  backend={do_backend}  frontend={do_frontend}  restart={restart_only}]")

# Modo --restart: solo reinicia contenedores, sin rebuild ni git pull (~5s)
if restart_only:
    print("\n=== Restart rapido (sin rebuild) ===")
    if do_backend:
        run(ssh, "docker compose -f /root/virtual-tryon/docker-compose.backend.yml restart")
    if do_frontend:
        run(ssh, "docker compose -f /root/virtual-tryon/docker-compose.frontend.yml restart")
    time.sleep(3)
    run(ssh, "docker ps --format 'table {{.Names}}\t{{.Status}}' | grep virtual-tryon")
    ssh.close()
    print("\nRestart completado.")
    sys.exit(0)

# 1. Git pull -- detectar que archivos cambiaron
out, _ = run(ssh, "cd /root/virtual-tryon && git pull origin main")

# Inferir que rebuildar si no se especifico flag
if not only_back and not only_front:
    backend_changed  = "backend/"  in out
    frontend_changed = "frontend/" in out
    # Si git pull no reporto cambios, rebuildar todo de todas formas
    if not backend_changed and not frontend_changed:
        backend_changed = frontend_changed = True
    do_backend  = backend_changed
    do_frontend = frontend_changed
    if do_backend  and not do_frontend: print("\n-> Solo cambio backend")
    if do_frontend and not do_backend:  print("\n-> Solo cambio frontend")
    if do_backend  and do_frontend:     print("\n-> Cambiaron backend y frontend")

# Avisar si cambiaron dependencias
if do_frontend and "package.json" in out and not no_cache:
    print("\n[AVISO] package.json cambio en frontend -- considera usar --no-cache")
if do_backend and "package.json" in out and not no_cache:
    print("\n[AVISO] package.json cambio en backend -- considera usar --no-cache")

# 2. Rebuild backend
if do_backend:
    print("\n=== Rebuild BACKEND ===")
    run(ssh, f"cd /root/virtual-tryon && docker compose -f docker-compose.backend.yml build {build_flag} 2>&1 | tail -15", timeout=300)
    run(ssh, "cd /root/virtual-tryon && docker compose -f docker-compose.backend.yml up -d")

# 3. Rebuild frontend
if do_frontend:
    print("\n=== Rebuild FRONTEND ===")
    run(ssh, f"cd /root/virtual-tryon && docker compose -f docker-compose.frontend.yml build {build_flag} 2>&1 | tail -20", timeout=600)
    run(ssh, "cd /root/virtual-tryon && docker compose -f docker-compose.frontend.yml up -d")

# 4. Estado de contenedores
time.sleep(4)
run(ssh, "docker ps --format 'table {{.Names}}\t{{.Status}}' | grep virtual-tryon")

# 5. Health check
print("\n=== Health check ===")
run(ssh, "curl -s -w '\\nHTTP: %{http_code}' https://api.pruebalo.wilkiedevs.com/health")

ssh.close()
print("\nDeploy completado.")
