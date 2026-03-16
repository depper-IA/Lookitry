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

# Ver el Dockerfile del backend en el VPS
print("=== Dockerfile del backend ===")
print(run('cat /root/virtual-tryon/backend/Dockerfile 2>/dev/null || echo "no existe"'))

# Ver el docker-compose del backend
print("\n=== docker-compose.backend.yml ===")
print(run('cat /root/virtual-tryon/docker-compose.backend.yml 2>/dev/null || echo "no existe"'))

# Ver qué archivos JS compilados hay en el contenedor
print("\n=== Archivos compilados en el contenedor ===")
print(run('docker exec virtual-tryon-backend ls /app/dist/ 2>/dev/null || docker exec virtual-tryon-backend ls /app/ 2>/dev/null'))

# Ver el errorHandler compilado para confirmar que tiene el fix
print("\n=== errorHandler.js compilado (buscar produccion) ===")
print(run('docker exec virtual-tryon-backend grep -r "produccion\|production.*return\|NODE_ENV.*production" /app/dist/ 2>/dev/null | head -5'))

# Ver el auth.routes.js compilado para confirmar asyncHandler
print("\n=== auth.routes.js compilado ===")
print(run('docker exec virtual-tryon-backend cat /app/dist/routes/auth.routes.js 2>/dev/null | head -20'))

# Ver qué error exacto mata el proceso — revisar el log completo desde el inicio
print("\n=== Logs completos del backend desde inicio ===")
print(run('docker logs virtual-tryon-backend 2>&1'))

client.close()
