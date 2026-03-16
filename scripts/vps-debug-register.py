import paramiko

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

# 1. Test directo al backend (sin Traefik)
print("=== POST /api/auth/register directo al backend ===")
print(run('''curl -s -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"prueba@test.com","password":"test1234","name":"Marca Test","slug":"marca-test"}' '''))

# 2. Test via Traefik con verbose para ver el error exacto
print("\n=== POST via HTTPS con verbose ===")
print(run('''curl -v -X POST https://api.pruebalo.wilkiedevs.com/api/auth/register \
  -H "Content-Type: application/json" \
  -H "Origin: https://pruebalo.wilkiedevs.com" \
  -d '{"email":"prueba@test.com","password":"test1234","name":"Marca Test","slug":"marca-test"}' 2>&1 | tail -30'''))

# 3. Logs del backend en tiempo real durante el request
print("\n=== Logs del backend (ultimos 20 lineas) ===")
print(run('docker logs virtual-tryon-backend --tail 20 2>&1'))

# 4. Ver variables de entorno del backend (sin secretos)
print("\n=== ENV del backend (claves relevantes) ===")
print(run('docker exec virtual-tryon-backend env | grep -E "^(NODE_ENV|PORT|CORS|FRONTEND|SUPABASE_URL|DATABASE)" | sort'))

# 5. Ver si el rate limiter está bloqueando
print("\n=== Rate limit status ===")
print(run('''curl -s -I -X POST https://api.pruebalo.wilkiedevs.com/api/auth/register \
  -H "Content-Type: application/json" 2>&1 | grep -E "HTTP|x-ratelimit|retry"'''))

client.close()
