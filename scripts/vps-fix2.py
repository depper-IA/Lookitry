import paramiko, time

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

# 1. Ver estructura del directorio raiz
print("=== /root/ ===")
print(run('ls -la /root/'))

print("\n=== /root/traefik* ===")
print(run('ls -la /root/traefik* 2>/dev/null || echo "no existe"'))

print("\n=== docker-compose en /root ===")
print(run('ls /root/*.yml /root/*.yaml 2>/dev/null || echo "ninguno"'))

# 2. Ver cómo está corriendo Traefik
print("\n=== Traefik docker inspect (labels y mounts) ===")
print(run('docker inspect root-traefik-1 --format "{{json .Mounts}}" 2>/dev/null'))

# 3. Ver el docker-compose que levantó Traefik
print("\n=== docker compose config de Traefik ===")
print(run('docker inspect root-traefik-1 --format "{{.Config.Labels}}" 2>/dev/null | tr , "\n" | grep -i "compose\|traefik\|certresolver\|acme" | head -20'))

# 4. Ver el archivo de certificados ACME
print("\n=== Archivo ACME (certificados) ===")
print(run('ls -la /root/letsencrypt/ 2>/dev/null || ls -la /opt/traefik/letsencrypt/ 2>/dev/null || echo "no encontrado"'))

# 5. Ver labels del contenedor backend para entender la config de Traefik
print("\n=== Labels del backend ===")
print(run('docker inspect virtual-tryon-backend --format "{{json .Config.Labels}}" | python3 -c "import sys,json; d=json.load(sys.stdin); [print(k,\'=\',v) for k,v in d.items() if \'traefik\' in k.lower()]"'))

# 6. Ver el error exacto del register con más detalle
print("\n=== Register con verbose desde dentro del contenedor ===")
print(run('''docker exec virtual-tryon-backend wget -qO- --post-data='{"email":"test@test.com","password":"Test1234!","name":"Test","slug":"test-slug"}' --header='Content-Type: application/json' http://localhost:3001/api/auth/register 2>&1 || echo "wget no disponible"'''))

client.close()
