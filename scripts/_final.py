import time
import paramiko

time.sleep(35)
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("31.220.18.39", username="root", password="Travis18456916#", timeout=15)
cmd = r"""
echo "Health check:"
curl -s -X GET https://n8n.wilkiedevs.com/healthz || echo "failed"
echo "\nWebhook check:"
curl -s -X POST https://n8n.wilkiedevs.com/webhook/wPLypk7KhBcFLicX -o /dev/null -w "%{http_code}" || echo "failed"
"""
stdin, stdout, stderr = client.exec_command(cmd, timeout=30)
print(stdout.read().decode("utf-8", errors="replace"))

client.close()
