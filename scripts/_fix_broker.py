#!/usr/bin/env python3
import sys
import paramiko

VPS_HOST = "31.220.18.39"
VPS_USER = "root"
VPS_PASS = "Travis18456916#"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(VPS_HOST, username=VPS_USER, password=VPS_PASS, timeout=15)
print("[OK] Connected")

cmd = """
cd /root/
# Add EXECUTIONS_MODE=main to docker-compose.yml to fix task broker crash
if ! grep -q "EXECUTIONS_MODE" docker-compose.yml; then
  sed -i '/environment:/a \      - EXECUTIONS_MODE=main\n      - N8N_RUNNERS_ENABLED=false' docker-compose.yml
fi
docker compose down n8n
docker compose up -d n8n
sleep 15
N8N_IP=$(docker inspect root-n8n-1 --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}')
echo "Activating workflow..."
curl -s -c /tmp/cookie.txt -X POST "http://$N8N_IP:5678/rest/login" -H "content-type: application/json" -d '{"email":"samwilkiedevs@gmail.com","password":"Travis2305*"}' > /dev/null
curl -s -b /tmp/cookie.txt -X PATCH "http://$N8N_IP:5678/rest/workflows/wPLypk7KhBcFLicX" -H "content-type: application/json" -d '{"active":true}'
echo "Done"
"""

stdin, stdout, stderr = client.exec_command(cmd, timeout=60)
print(stdout.read().decode("utf-8", errors="replace"))

client.close()
