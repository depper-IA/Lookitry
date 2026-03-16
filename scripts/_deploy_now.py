"""
Deploy script — virtual-tryon
Uso:
  python _deploy_now.py              → rebuild solo lo que cambió (rápido, usa caché Docker)
  python _deploy_now.py --no-cache   → rebuild completo sin caché (lento, para cambios en deps)
  python _deploy_now.py --backend    → solo backend
  python _deploy_now.py --frontend   → solo frontend
"""
import paramiko
import time
import sys

HOST = "31.220.18.39"
USER = "root"
PASS = "Travis18456916#"

args = sys.argv[1:]
no_cache    = "--no-cache" in args
only_back   = "--backend"  in args
only_front  = "--frontend" in args
do_backend  = only_back  or (not only_front)
do_frontend = only_front or (not only_back)

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
print(f"Conectado al VPS  [no-cache={no_cache}  backend={do_backend}  frontend={do_frontend}]")

# 1. Git pull — detectar qué archivos cambiaron
out, _ = run(ssh, "cd /root/virtual-tryon && git pull origin main")

# Inferir qué rebuildar si no se especificó flag
if not only_back and not only_front:
    backend_changed  = "backend/"  in out
    frontend_changed = "frontend/" in out
    # Si git pull no reportó cambios, rebuildar todo de todas formas
    if not backend_changed and not frontend_changed:
        backend_changed = frontend_changed = True
    do_backend  = backend_changed
    do_frontend = frontend_changed
    if do_backend  and not do_frontend: print("\n→ Solo cambió backend")
    if do_frontend and not do_backend:  print("\n→ Solo cambió frontend")
    if do_backend  and do_frontend:     print("\n→ Cambiaron backend y frontend")

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
