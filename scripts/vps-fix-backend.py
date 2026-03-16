import paramiko, json

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

# 1. Estado del contenedor
print("=== Estado del contenedor backend ===")
print(run('docker ps -a --filter name=virtual-tryon-backend --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"'))

# 2. IP del contenedor en la red proxy
print("\n=== IP del backend en red proxy ===")
ip_raw = run('docker inspect virtual-tryon-backend --format "{{range .NetworkSettings.Networks}}{{.IPAddress}} {{end}}"')
print(f"IPs: {ip_raw}")
backend_ip = ip_raw.strip().split()[0] if ip_raw.strip() else None

# 3. Test directo por IP del contenedor
if backend_ip:
    print(f"\n=== Test directo a {backend_ip}:3001 ===")
    print(run(f'curl -s --max-time 5 http://{backend_ip}:3001/health'))
    
    print(f"\n=== POST register directo a {backend_ip}:3001 ===")
    print(run(f'''curl -s --max-time 10 -X POST http://{backend_ip}:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d \'{{"email":"test@test.com","password":"Test1234!","name":"Test Brand","slug":"test-brand"}}\' '''))

# 4. Ver la configuración de Traefik para el backend
print("\n=== Router vt-backend en Traefik ===")
out = run('curl -s http://localhost:8080/api/http/routers/vt-backend@docker 2>/dev/null')
try:
    data = json.loads(out)
    print(f"Status: {data.get('status')}")
    print(f"Rule: {data.get('rule')}")
    print(f"Service: {data.get('service')}")
    print(f"TLS: {data.get('tls')}")
    print(f"Error: {data.get('err', 'ninguno')}")
except:
    print(out[:600])

# 5. Ver el servicio en Traefik
print("\n=== Servicio vt-backend en Traefik ===")
out = run('curl -s http://localhost:8080/api/http/services/vt-backend@docker 2>/dev/null')
try:
    data = json.loads(out)
    servers = data.get('loadBalancer', {}).get('servers', [])
    print(f"Servers: {servers}")
    status = data.get('serverStatus', {})
    print(f"Server status: {status}")
except:
    print(out[:600])

# 6. Logs de Traefik filtrando errores del backend
print("\n=== Logs Traefik (errores backend) ===")
print(run('docker logs root-traefik-1 --tail 30 2>&1 | grep -iE "backend|vt-back|502|error|bad" | tail -20'))

# 7. Logs del backend (ultimas 30 lineas incluyendo errores)
print("\n=== Logs backend (ultimas 30 lineas) ===")
print(run('docker logs virtual-tryon-backend --tail 30 2>&1'))

client.close()
