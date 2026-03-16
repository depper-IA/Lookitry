import paramiko, json

HOST = '31.220.18.39'
PORT = 22
USER = 'root'
PASS = 'Travis18456916#'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, port=PORT, username=USER, password=PASS, timeout=15)

def run(cmd, timeout=15):
    _, stdout, _ = client.exec_command(cmd, timeout=timeout)
    return stdout.read().decode().strip()

# 1. Ver IP del contenedor en la red proxy
print("=== IP del backend en red proxy ===")
print(run('docker inspect virtual-tryon-backend --format "{{json .NetworkSettings.Networks}}"'))

# 2. Ver si Traefik puede alcanzar el backend internamente
print("\n=== Traefik -> backend (interno) ===")
backend_ip = run('docker inspect virtual-tryon-backend --format "{{range .NetworkSettings.Networks}}{{.IPAddress}} {{end}}"')
print(f"IPs del backend: {backend_ip}")

# Intentar curl desde Traefik al backend
print(run(f'docker exec root-traefik-1 wget -qO- http://{backend_ip.split()[0]}:3001/health 2>/dev/null || echo "no alcanzable"'))

# 3. Ver la ruta en Traefik
print("\n=== Ruta vt-backend en Traefik ===")
out = run('curl -s http://localhost:8080/api/http/routers/vt-backend@docker')
try:
    data = json.loads(out)
    print(f"Status: {data.get('status')}")
    print(f"Rule: {data.get('rule')}")
    print(f"Service: {data.get('service')}")
    print(f"Error: {data.get('err', 'ninguno')}")
except:
    print(out[:500])

# 4. Ver el servicio en Traefik
print("\n=== Servicio vt-backend en Traefik ===")
out = run('curl -s http://localhost:8080/api/http/services/vt-backend@docker')
try:
    data = json.loads(out)
    print(json.dumps(data, indent=2)[:800])
except:
    print(out[:500])

# 5. Logs recientes de Traefik
print("\n=== Logs Traefik (ultimos 60s) ===")
print(run('docker logs root-traefik-1 --since 60s 2>&1 | grep -i "backend\|vt-back\|error\|bad" | tail -15'))

client.close()
