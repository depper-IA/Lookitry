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

# Ver el Dockerfile del frontend
print("=== Dockerfile del frontend ===")
print(run('cat /root/virtual-tryon/frontend/Dockerfile'))

# Buscar la URL del API hardcodeada en el JS compilado
print("\n=== Buscar localhost en el JS compilado ===")
print(run('grep -r "localhost:3001" /root/virtual-tryon/frontend/.next/static/ 2>/dev/null | head -5 || echo "no encontrado en .next local"'))

# Buscar en el contenedor
print("\n=== Buscar localhost en el JS del contenedor ===")
print(run('docker exec virtual-tryon-frontend grep -r "localhost:3001" /app/.next/static/ 2>/dev/null | wc -l'))
print(run('docker exec virtual-tryon-frontend grep -r "localhost:3001" /app/.next/static/ 2>/dev/null | head -3'))

# Buscar la URL correcta en el JS del contenedor
print("\n=== Buscar api.pruebalo en el JS del contenedor ===")
print(run('docker exec virtual-tryon-frontend grep -r "api.pruebalo" /app/.next/static/ 2>/dev/null | wc -l'))

client.close()
