import paramiko, time

HOST = '31.220.18.39'
PORT = 22
USER = 'root'
PASS = 'Travis18456916#'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, port=PORT, username=USER, password=PASS, timeout=15)

def run(cmd, timeout=30):
    _, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    return out + ('\n[STDERR]: ' + err if err else '')

# Test de conectividad de Supabase desde el backend
print("=== Conectividad Supabase desde el backend ===")
supabase_url = run('docker exec virtual-tryon-backend env | grep SUPABASE_URL | cut -d= -f2')
print(f"URL: {supabase_url}")

# Hacer un curl a Supabase desde dentro del contenedor
print(run(f'docker exec virtual-tryon-backend sh -c "wget -qO- --timeout=5 {supabase_url}/rest/v1/ 2>&1 | head -5" 2>/dev/null || echo "wget no disponible"'))

# Ver si hay algún error de red
print("\n=== Test de red desde el contenedor backend ===")
print(run('docker exec virtual-tryon-backend sh -c "cat /etc/resolv.conf" 2>/dev/null'))

# Ver el .env del backend en el VPS
print("\n=== .env del backend en VPS ===")
print(run('cat /root/virtual-tryon/backend/.env 2>/dev/null | grep -v "KEY\|SECRET\|PASS\|TOKEN" || echo "no existe"'))

# Ver cómo está montado el backend
print("\n=== Mounts del backend ===")
print(run('docker inspect virtual-tryon-backend --format "{{json .Mounts}}" 2>/dev/null'))

# Ver el docker-compose del virtual-tryon
print("\n=== docker-compose del virtual-tryon ===")
print(run('ls /root/virtual-tryon/ 2>/dev/null'))
print(run('cat /root/virtual-tryon/docker-compose.yml 2>/dev/null || echo "no existe"'))

# Ver si hay un .env en el directorio del virtual-tryon
print("\n=== Archivos .env en virtual-tryon ===")
print(run('ls -la /root/virtual-tryon/*.env /root/virtual-tryon/.env /root/virtual-tryon/backend/.env 2>/dev/null || echo "ninguno"'))

# Ver las variables de entorno del contenedor (las que no son secretos)
print("\n=== ENV del backend (todas las claves) ===")
print(run('docker exec virtual-tryon-backend env | grep -v "KEY\|SECRET\|PASS\|TOKEN\|HASH" | sort'))

client.close()
