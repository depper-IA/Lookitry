import paramiko, time, sys, os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '../backend/.env'))

HOST = os.getenv("VPS_HOST", "31.220.18.39")
USER = os.getenv("VPS_USER", "root")
PASS = os.getenv("VPS_PASS", "Travis18456916#")
REPO = "/root/virtual-tryon"
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "")
GITHUB_REPO = os.getenv("GITHUB_REPO", "https://github.com/depper-IA/Lookitry.git")
# URL con token para autenticación
if GITHUB_TOKEN:
    REPO_URL = GITHUB_REPO.replace("https://", f"https://{GITHUB_TOKEN}@")
else:
    REPO_URL = GITHUB_REPO

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASS, timeout=30)
print(f"Conectado al VPS -> {REPO}")

def run(cmd, timeout=600):
    print(f"\n$ {cmd}")
    _, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode(errors="replace")
    err = stderr.read().decode(errors="replace")
    if out.strip(): print(out.strip())
    if err.strip(): print("[stderr]", err.strip())
    return out

run(f"cd {REPO} && git remote set-url origin {REPO_URL} && git pull origin main")
print("\n=== Rebuild FRONTEND ===")
run(f"cd {REPO} && docker compose -f docker-compose.frontend.yml build 2>&1 | tail -25", timeout=600)
run(f"cd {REPO} && docker compose -f docker-compose.frontend.yml up -d")
time.sleep(4)
run("docker ps --format 'table {{.Names}}\t{{.Status}}'")
print("\n=== Health check ===")
run("curl -s -w '\\nHTTP: %{http_code}' https://api.lookitry.com/health")
ssh.close()
print("\nDeploy completado.")
