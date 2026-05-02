"""
Deploy script -- Lookitry
Uso:
  python _deploy_now.py              -> deploy solo si origin/main trae cambios
  python _deploy_now.py --no-cache   -> rebuild completo sin cache
  python _deploy_now.py --backend    -> solo backend
  python _deploy_now.py --frontend   -> solo frontend
  python _deploy_now.py --restart    -> solo reinicia contenedores SIN rebuild
  python _deploy_now.py --force      -> rebuild aunque origin/main no tenga cambios nuevos

Tiempos aproximados:
  --restart   : ~5s
  normal      : ~0s si no hay cambios, ~2min frontend, ~1min backend
  --no-cache  : ~5min

Dependencias requeridas:
  pip install paramiko python-dotenv
"""

import os
import subprocess
import sys
import time


for pkg, import_name in [("paramiko", "paramiko"), ("python-dotenv", "dotenv")]:
    try:
        __import__(import_name)
    except ImportError:
        print(f"[setup] Instalando {pkg}...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", pkg, "--break-system-packages", "-q"])

import paramiko
from dotenv import load_dotenv


load_dotenv(os.path.join(os.path.dirname(__file__), "../backend/.env"))

HOST = os.getenv("VPS_HOST", "31.220.18.39")
USER = os.getenv("VPS_USER", "root")
PASS = os.getenv("VPS_PASS")
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "")
GITHUB_REPO = os.getenv("GITHUB_REPO", "https://github.com/depper-IA/Lookitry.git")
REPO = "/root/virtual-tryon"

REPO_URL = (
    GITHUB_REPO.replace("https://", f"https://{GITHUB_TOKEN}@")
    if GITHUB_TOKEN
    else GITHUB_REPO
)

if not PASS:
    print("Error: La variable VPS_PASS no esta definida en backend/.env.")
    sys.exit(1)

args = sys.argv[1:]
no_cache = "--no-cache" in args
only_back = "--backend" in args
only_front = "--frontend" in args
restart_only = "--restart" in args
force_deploy = "--force" in args
do_backend = only_back or (not only_front)
do_frontend = only_front or (not only_back)
build_flag = "--no-cache" if no_cache else ""


def redact_command(cmd):
    if not GITHUB_TOKEN:
        return cmd
    return cmd.replace(GITHUB_TOKEN, "***")


def run(ssh, cmd, timeout=300, check=True):
    print(f"\n$ {redact_command(cmd)}")
    _, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode(errors="replace")
    err = stderr.read().decode(errors="replace")
    code = stdout.channel.recv_exit_status()
    if out.strip():
        print(out.strip())
    if err.strip():
        print("[stderr]", err.strip())
    if check and code != 0:
        raise RuntimeError(f"Comando fallo con exit code {code}: {cmd}")
    return out, err, code


def contains_path(changed_files, prefix):
    return any(line.startswith(prefix) for line in changed_files.splitlines())


def wait_for_health(ssh, attempts=8, delay=5):
    for attempt in range(1, attempts + 1):
        print(f"\n=== Health check ({attempt}/{attempts}) ===")
        out, _, code = run(
            ssh,
            "curl -s -w '\\nHTTP: %{http_code}' https://api.lookitry.com/health",
            check=False,
        )
        if code == 0 and "HTTP: 200" in out:
            return
        if attempt < attempts:
            time.sleep(delay)
    raise RuntimeError("Health check no respondio 200 despues de varios intentos.")


ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASS, timeout=30)

print(
    f"Conectado al VPS  [no-cache={no_cache}  backend={do_backend}  frontend={do_frontend}  "
    f"restart={restart_only}  force={force_deploy}]"
)

if restart_only:
    print("\n=== Restart rapido (sin rebuild) ===")
    if do_backend:
        run(ssh, f"docker compose -f {REPO}/docker-compose.backend.yml restart")
    if do_frontend:
        run(ssh, f"docker compose -f {REPO}/docker-compose.frontend.yml restart")
    time.sleep(3)
    run(ssh, "docker ps --format 'table {{.Names}}\\t{{.Status}}'")
    ssh.close()
    print("\nRestart completado.")
    sys.exit(0)

run(ssh, f"cd {REPO} && git fetch {REPO_URL} main:refs/remotes/origin/main")
current_sha, _, _ = run(ssh, f"cd {REPO} && git rev-parse HEAD")
remote_sha, _, _ = run(ssh, f"cd {REPO} && git rev-parse origin/main")
current_sha = current_sha.strip()
remote_sha = remote_sha.strip()

changed_files = ""
if current_sha != remote_sha:
    changed_files, _, _ = run(
        ssh, f"cd {REPO} && git diff --name-only HEAD..origin/main"
    )
    run(ssh, f"cd {REPO} && git reset --hard origin/main && git clean -fd")
else:
    print("\nSin commits nuevos en origin/main.")

backend_changed = False
frontend_changed = False

if not only_back and not only_front:
    if current_sha != remote_sha:
        backend_changed = (
            contains_path(changed_files, "backend/")
            or contains_path(changed_files, "sammy/")
            or "docker-compose.backend.yml" in changed_files
        )
        frontend_changed = (
            contains_path(changed_files, "frontend/")
            or "docker-compose.frontend.yml" in changed_files
        )
        if contains_path(changed_files, "lookitry-woocommerce/"):
            print(
                "\n[INFO] Cambios del plugin WooCommerce detectados. "
                "WordPress se sincroniza automaticamente al hacer push a main."
            )
    if force_deploy:
        backend_changed = True
        frontend_changed = True
    if not backend_changed and not frontend_changed:
        print("\nNo hay cambios nuevos en backend/frontend. Deploy omitido.")
        ssh.close()
        sys.exit(0)
    do_backend = backend_changed
    do_frontend = frontend_changed
    if do_backend and not do_frontend:
        print("\n-> Solo cambio backend")
    if do_frontend and not do_backend:
        print("\n-> Solo cambio frontend")
    if do_backend and do_frontend:
        print("\n-> Cambiaron backend y frontend")

if do_frontend and "frontend/package.json" in changed_files and not no_cache:
    print("\n[AVISO] frontend/package.json cambio. Considera usar --no-cache")
if do_backend and "backend/package.json" in changed_files and not no_cache:
    print("\n[AVISO] backend/package.json cambio. Considera usar --no-cache")

# Asegurar que la pantalla de mantenimiento esté arriba ANTES de tocar nada
print("\n=== Preparando pantalla de mantenimiento ===")
run(ssh, f"cd {REPO} && docker compose -f docker-compose.errors.yml up -d")

if do_backend:
    print("\n=== Rebuild BACKEND ===")
    # Subir env file de Sammy si no existe en VPS
    sammy_env_local = os.path.join(
        os.path.dirname(__file__), "..", "sammy", ".env.production"
    )
    if os.path.exists(sammy_env_local):
        print(f"[INFO] Subiendo sammy/.env.production al VPS...")
        with open(sammy_env_local, "r", encoding="utf-8") as f:
            sammy_env_content = f.read()
        run(
            ssh,
            f"cat > {REPO}/sammy/.env.production << 'SAMMYEOF'\n{sammy_env_content}\nSAMMYEOF",
            check=False,
        )
    else:
        run(
            ssh,
            f"if [ ! -f {REPO}/sammy/.env.production ]; then touch {REPO}/sammy/.env.production; fi",
            check=False,
        )

    build_cmd_backend = (
        f"cd {REPO} && docker compose -f docker-compose.backend.yml down && "
        f"docker compose -f docker-compose.backend.yml build {build_flag} > docker_build_backend.log 2>&1 || "
        f"{{ tail -20 docker_build_backend.log; exit 1; }}"
    )
    run(ssh, build_cmd_backend, timeout=300)
    run(ssh, f"cd {REPO} && docker compose -f docker-compose.backend.yml up -d")

if do_frontend:
    print("\n=== Rebuild FRONTEND ===")
    # Subir env file de frontend si existe en local
    frontend_env_local = os.path.join(
        os.path.dirname(__file__), "..", "frontend", ".env.production"
    )
    if os.path.exists(frontend_env_local):
        print(f"[INFO] Subiendo frontend/.env.production al VPS...")
        with open(frontend_env_local, "r", encoding="utf-8") as f:
            frontend_env_content = f.read()
        run(
            ssh,
            f"cat > {REPO}/frontend/.env.production << 'FRONTENDEOF'\n{frontend_env_content}\nFRONTENDEOF",
            check=False,
        )
        # Extraer solo variables NEXT_PUBLIC_* y permitidas para crear .env que docker-compose usa
        ALLOWED_SERVER_KEYS = ["SUPABASE_SERVICE_KEY", "TURNSTILE_SECRET_KEY"]
        env_lines = []
        for line in frontend_env_content.splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key = line.split("=")[0]
                if key.startswith("NEXT_PUBLIC_") or key in ALLOWED_SERVER_KEYS:
                    env_lines.append(line)
        env_file_content = "\n".join(env_lines)
        print(
            f"[INFO] Creando .env con {len(env_lines)} variables para docker-compose..."
        )
        run(
            ssh,
            f"cat > {REPO}/.env << 'ENVEOF'\n{env_file_content}\nENVEOF",
            check=False,
        )
    build_cmd = (
        f"cd {REPO} && docker compose -f docker-compose.frontend.yml down && "
        f"docker compose -f docker-compose.frontend.yml build {build_flag} > docker_build_frontend.log 2>&1 || "
        f"{{ tail -20 docker_build_frontend.log; exit 1; }}"
    )
    run(ssh, build_cmd, timeout=1800)
    run(ssh, f"cd {REPO} && docker compose -f docker-compose.frontend.yml up -d")

run(ssh, "docker ps --format 'table {{.Names}}\\t{{.Status}}'")

wait_for_health(ssh)

print("\n=== Limpiando pantalla de mantenimiento ===")
run(ssh, f"cd {REPO} && docker compose -f docker-compose.errors.yml down")

ssh.close()
print("\nDeploy completado.")
