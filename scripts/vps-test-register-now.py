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

# Obtener la IP actual del backend
backend_ip = run('docker inspect virtual-tryon-backend --format "{{range .NetworkSettings.Networks}}{{.IPAddress}} {{end}}"').strip().split()[0]
print(f"IP del backend: {backend_ip}")

# Test 1: health check directo
print("\n=== Health check directo ===")
print(run(f'curl -s --max-time 5 http://{backend_ip}:3001/health'))

# Test 2: register con curl y verbose para ver exactamente qué pasa
print("\n=== Register directo con verbose ===")
print(run(f'''curl -v --max-time 15 -X POST http://{backend_ip}:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d \'{{"email":"directtest@test.com","password":"Test1234!","name":"Direct Test","slug":"direct-test-x1"}}\' 2>&1''', timeout=20))

# Ver logs inmediatamente después
print("\n=== Logs del backend después del request ===")
print(run('docker logs virtual-tryon-backend --tail 20 2>&1'))

# Test 3: ver si el contenedor sigue vivo
print("\n=== Estado del contenedor ===")
print(run('docker ps --filter name=virtual-tryon-backend --format "{{.Names}} {{.Status}}"'))

client.close()
