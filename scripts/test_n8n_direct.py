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

# Test n8n con la imagen directa (sin proxy) del Casco
cmd = (
    "curl -s -o /tmp/n8n_direct.txt -w '\\nHTTP_CODE:%{http_code}' "
    "-X POST https://n8n.wilkiedevs.com/webhook/descriptor "
    "-H 'Content-Type: application/json' "
    "-d '{\"image_url\":\"https://wilkiedevs.com/wp-content/uploads/2026/03/casco.png\","
    "\"product_name\":\"Casco Harley\",\"category\":\"accessories\"}' ; "
    "echo; echo BODY:; cat /tmp/n8n_direct.txt | head -c 500"
)
stdin, stdout, _ = ssh.exec_command(cmd, timeout=40)
result = stdout.read().decode("utf-8", errors="replace")
print("--- n8n directo con URL original ---")
print(result)

# Test n8n con img-proxy 
cmd2 = (
    "curl -s -o /tmp/n8n_proxy.txt -w '\\nHTTP_CODE:%{http_code}' "
    "-X POST https://n8n.wilkiedevs.com/webhook/descriptor "
    "-H 'Content-Type: application/json' "
    "-d '{\"image_url\":\"https://api.lookitry.com/api/pruebalo/img-proxy?url=https%3A%2F%2Fwilkiedevs.com%2Fwp-content%2Fuploads%2F2026%2F03%2Fcasco.png\","
    "\"product_name\":\"Casco Harley\",\"category\":\"accessories\"}' ; "
    "echo; echo BODY:; cat /tmp/n8n_proxy.txt | head -c 500"
)
stdin2, stdout2, _ = ssh.exec_command(cmd2, timeout=40)
result2 = stdout2.read().decode("utf-8", errors="replace")
print("\n--- n8n con img-proxy ---")
print(result2)

ssh.close()
