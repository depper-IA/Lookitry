import paramiko, time, json

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

# 1. Estado de todos los contenedores
print("=== Estado de contenedores ===")
print(run('docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"'))

# 2. Logs de Traefik (últimos 30s) para ver si httpChallenge funciona
print("\n=== Logs Traefik (últimos 30s) ===")
print(run('docker logs root-traefik-1 --since 30s 2>&1 | tail -20'))

# 3. Test del register via HTTPS con timeout largo
print("\n=== POST register via HTTPS (timeout 20s) ===")
print(run('''curl -s --max-time 20 -X POST https://api.pruebalo.wilkiedevs.com/api/auth/register \
  -H "Content-Type: application/json" \
  -H "Origin: https://pruebalo.wilkiedevs.com" \
  -d '{"email":"test-final@test.com","password":"Test1234!","name":"Test Brand Final","slug":"test-brand-final"}' ''', timeout=25))

# 4. Logs del backend después del request
print("\n=== Logs backend después del register ===")
print(run('docker logs virtual-tryon-backend --tail 10 2>&1'))

# 5. Ver si el router de Traefik ya reconoce el backend
print("\n=== Router vt-backend en Traefik ===")
out = run('curl -s http://localhost:8080/api/http/routers/vt-backend@docker 2>/dev/null')
try:
    data = json.loads(out)
    print(f"Status: {data.get('status')}")
    print(f"Rule: {data.get('rule')}")
    print(f"Error: {data.get('err', 'ninguno')}")
except:
    print(out[:400])

# 6. Ver si el servicio tiene el servidor registrado
print("\n=== Servicio vt-backend en Traefik ===")
out = run('curl -s http://localhost:8080/api/http/services/vt-backend@docker 2>/dev/null')
try:
    data = json.loads(out)
    servers = data.get('loadBalancer', {}).get('servers', [])
    status = data.get('serverStatus', {})
    print(f"Servers: {servers}")
    print(f"Status: {status}")
except:
    print(out[:400])

client.close()
