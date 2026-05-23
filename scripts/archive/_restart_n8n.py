import sys
import paramiko
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("31.220.18.39", username="root", password="Travis18456916#", timeout=15)

cmd = """
docker restart root-n8n-1
sleep 30
echo "Check webhook publicly..."
curl -s -X POST https://n8n.wilkiedevs.com/webhook/wPLypk7KhBcFLicX -o /dev/null -w "%{http_code}" || echo "failed"
"""

stdin, stdout, stderr = client.exec_command(cmd, timeout=45)
print(stdout.read().decode("utf-8", errors="replace"))

client.close()
