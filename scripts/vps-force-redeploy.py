import paramiko, time

HOST = '31.220.18.39'
PORT = 22
USER = 'root'
PASS = 'Travis18456916#'
GITHUB_TOKEN = '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'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, port=PORT, username=USER, password=PASS, timeout=15)

def run(cmd, timeout=120):
    _, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    return out + ('\n[STDERR]: ' + err if err else '')

print("=== Pull ===")
print(run(f'cd /root/virtual-tryon && git pull https://{GITHUB_TOKEN}@github.com/depper-IA/virtual-tryon.git main 2>&1'))

# Limpiar contenedores viejos con ese nombre
print("\n=== Limpiando contenedores viejos ===")
print(run('docker rm -f virtual-tryon-backend 2>/dev/null || echo "ya limpio"'))
print(run('docker ps -a | grep virtual-tryon-backend'))

# Rebuild
print("\n=== Rebuild ===")
print(run('cd /root/virtual-tryon && docker compose -f docker-compose.backend.yml build --no-cache 2>&1 | tail -5', timeout=180))

# Deploy limpio
print("\n=== Deploy ===")
print(run('cd /root/virtual-tryon && docker compose -f docker-compose.backend.yml up -d 2>&1'))

time.sleep(8)

print("\n=== Estado ===")
print(run('docker ps --filter name=virtual-tryon-backend --format "{{.Names}} {{.Status}}"'))

print("\n=== Logs arranque ===")
print(run('docker logs virtual-tryon-backend --tail 8 2>&1'))

# Test del register
print("\n=== Test register ===")
backend_ip = run('docker inspect virtual-tryon-backend --format "{{range .NetworkSettings.Networks}}{{.IPAddress}} {{end}}"').strip().split()[0]
print(f"IP: {backend_ip}")

result = run(f'''curl -s --max-time 15 -X POST http://{backend_ip}:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d \'{{"email":"bcrypttest@test.com","password":"Test1234!","name":"Bcrypt Test","slug":"bcrypt-test-x1"}}\' ''', timeout=20)
print(f"Respuesta: {result}")

time.sleep(2)
print("\n=== Logs después del register ===")
print(run('docker logs virtual-tryon-backend --tail 10 2>&1'))

print("\n=== Estado final ===")
print(run('docker ps --filter name=virtual-tryon-backend --format "{{.Names}} {{.Status}}"'))

client.close()
