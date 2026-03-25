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

# 1. Logs recientes
stdin, stdout, stderr = ssh.exec_command("docker logs --tail 40 lookitry-backend 2>&1 | cat")
print("=== BACKEND LOGS ===")
print(stdout.read().decode("ascii", errors="replace"))

# 2. Probar directamente n8n con imagen proxied
print("\n=== TEST N8N WITH PROXIED URL ===")
proxied = "https://api.lookitry.com/api/pruebalo/img-proxy?url=https%3A%2F%2Fwilkiedevs.com%2Fwp-content%2Fuploads%2F2026%2F03%2Fcasco.png"
cmd = (
    "curl -s -o /tmp/n8n_resp.txt -w 'HTTP: %{http_code}' "
    "-X POST https://n8n.wilkiedevs.com/webhook/descriptor "
    "-H 'Content-Type: application/json' "
    f"-d '{{\"image_url\":\"{proxied}\",\"product_name\":\"Casco test\",\"category\":\"accessories\"}}' ; "
    "echo; echo '--- RESP BODY ---'; cat /tmp/n8n_resp.txt"
)
stdin2, stdout2, stderr2 = ssh.exec_command(cmd, timeout=30)
print(stdout2.read().decode("ascii", errors="replace"))

ssh.close()
