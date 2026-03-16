import paramiko

HOST = '31.220.18.39'
PORT = 22
USER = 'root'
PASS = 'Travis18456916#'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, port=PORT, username=USER, password=PASS, timeout=15)

def run(cmd, timeout=20):
    _, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    return out + ('\n[STDERR]: ' + err if err else '')

# Ver el .env del frontend en el VPS
print("=== .env del frontend en VPS ===")
print(run('cat /root/virtual-tryon/frontend/.env 2>/dev/null || echo "no existe"'))
print(run('cat /root/virtual-tryon/frontend/.env.production 2>/dev/null || echo "no existe"'))

# Ver el docker-compose del frontend
print("\n=== docker-compose.frontend.yml ===")
print(run('cat /root/virtual-tryon/docker-compose.frontend.yml'))

# Ver las variables de entorno dentro del contenedor frontend
print("\n=== ENV dentro del contenedor frontend ===")
print(run('docker exec virtual-tryon-frontend env | grep -E "NEXT_PUBLIC|API|URL" 2>/dev/null | sort'))

# Ver el archivo .env.local o next.config dentro del contenedor
print("\n=== next.config.js en el contenedor ===")
print(run('docker exec virtual-tryon-frontend cat /app/next.config.js 2>/dev/null | head -30'))

client.close()
