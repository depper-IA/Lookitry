import paramiko, time, json

HOST = '31.220.18.39'
PORT = 22
USER = 'root'
PASS = 'Travis18456916#'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, port=PORT, username=USER, password=PASS, timeout=15)

def run(cmd, timeout=60):
    _, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    return out + ('\n[STDERR]: ' + err if err else '')

# ============================================================
# DIAGNÓSTICO: qué URL tiene embebida el frontend actual
# ============================================================
print("=== 1. URL embebida en el JS del frontend ===")
# Buscar en los archivos JS del build de Next.js
print(run('docker exec virtual-tryon-frontend find /app/.next -name "*.js" 2>/dev/null | head -5'))
print(run('docker exec virtual-tryon-frontend grep -r "NEXT_PUBLIC_API_URL\|api\.pruebalo\|localhost:3001" /app/.next/static 2>/dev/null | head -5 || echo "no encontrado en static"'))
print(run('docker exec virtual-tryon-frontend grep -rl "api\.pruebalo\|localhost:3001\|localhost:300" /app/.next 2>/dev/null | head -5'))

print("\n=== 2. Variables de entorno del contenedor frontend ===")
print(run('docker inspect virtual-tryon-frontend --format "{{range .Config.Env}}{{println .}}{{end}}" 2>/dev/null | grep -i "api\|url\|next"'))

print("\n=== 3. docker-compose.frontend.yml actual ===")
print(run('cat /root/virtual-tryon/docker-compose.frontend.yml'))

# ============================================================
# FIX SSL: El problema es que Traefik redirige HTTP→HTTPS
# antes de responder al ACME challenge.
# Solución: agregar una excepción para /.well-known/acme-challenge
# en el router del frontend, o mejor: usar tlsChallenge que no
# necesita HTTP. Pero el cert ya existe válido (Mar 12 - Jun 10).
# La solución real: inyectar el cert existente en acme.json
# ============================================================
print("\n=== 4. Verificar si el cert existe en el sistema ===")
print(run('find /etc/letsencrypt /root -name "*.pem" -o -name "fullchain*" -o -name "cert*" 2>/dev/null | grep -i "pruebalo\|wilkie" | head -10'))
print(run('ls /etc/letsencrypt/live/ 2>/dev/null || echo "no existe /etc/letsencrypt/live"'))

print("\n=== 5. Contenido actual de acme.json ===")
acme_path = run('docker volume inspect traefik_data --format "{{.Mountpoint}}"')
print(f"Ruta: {acme_path}")
print(run(f'cat {acme_path}/acme.json 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); certs=d.get(\'mytlschallenge\',{{}}).get(\'Certificates\',[]) or []; print(\'Certs:\', len(certs)); [print(c.get(\'domain\',{{}}).get(\'main\',\'?\')) for c in certs]" 2>/dev/null || echo "vacio o error"'))

# ============================================================
# FIX SSL: La solución más limpia es usar certbot directamente
# para obtener el cert y luego inyectarlo en acme.json
# O mejor: configurar Traefik para que NO redirija el challenge
# ============================================================
print("\n=== 6. Verificar si certbot está disponible ===")
print(run('which certbot 2>/dev/null || apt list --installed 2>/dev/null | grep certbot || echo "certbot no instalado"'))

print("\n=== 7. Verificar la regla de redirección HTTP en Traefik ===")
print(run('cat /root/docker-compose.yml | grep -A3 -B3 "redirect\|http\|entrypoint" | head -30'))

client.close()
