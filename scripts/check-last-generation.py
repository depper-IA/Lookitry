import paramiko, json

host = '31.220.18.39'
user = 'root'
pwd = 'Travis18456916#'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=pwd, timeout=30)

def run(cmd):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=60)
    return stdout.read().decode()

# 1. Últimas líneas de logs del backend
print('=== LOGS BACKEND (ultimas 80 lineas) ===')
logs = run('docker logs virtual-tryon-backend --tail 80 2>&1')
print(logs)

# 2. Ver últimas generaciones en la BD via el backend
print('\n=== ULTIMAS GENERACIONES (via docker exec) ===')
# Buscar en logs cualquier imageUrl o result_image_url
import re
urls = re.findall(r'https?://[^\s\'"]+', logs)
for u in urls:
    if 'minio' in u or 'image' in u or 'tryon' in u or 'temp' in u:
        print('URL encontrada:', u)

client.close()
