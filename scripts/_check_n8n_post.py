import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("31.220.18.39", username="root", password="Travis18456916#", timeout=15)

cmd = """
curl -X POST "https://n8n.wilkiedevs.com/webhook/tryon" \\
     -H "Content-Type: application/json" \\
     -d '{"brand_id":"123", "product_id":"abc", "selfie_url":"https://url", "product_image_url":"https://url", "prompt":"test"}'
"""
stdin, stdout, stderr = client.exec_command(cmd)
print("HTTP RESPONSE:", stdout.read().decode('utf-8'))
print("HTTP ERR:", stderr.read().decode('utf-8'))

client.close()
