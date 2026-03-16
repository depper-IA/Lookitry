import paramiko, time

HOST = '31.220.18.39'
PORT = 22
USER = 'root'
PASS = 'Travis18456916#'
GITHUB_TOKEN = '***REMOVED-SECRET***'

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

print("\n=== Rebuild ===")
print(run('cd /root/virtual-tryon && docker compose -f docker-compose.backend.yml build --no-cache 2>&1 | tail -5', timeout=180))

print("\n=== Restart ===")
print(run('cd /root/virtual-tryon && docker compose -f docker-compose.backend.yml up -d --force-recreate 2>&1'))

time.sleep(6)

print("\n=== Estado ===")
print(run('docker ps --filter name=virtual-tryon-backend --format "{{.Names}} {{.Status}}"'))

# Hacer el request y esperar logs
print("\n=== Lanzando request de register ===")
backend_ip = run('docker inspect virtual-tryon-backend --format "{{range .NetworkSettings.Networks}}{{.IPAddress}} {{end}}"').strip().split()[0]
print(f"IP: {backend_ip}")

run(f'''curl -s --max-time 10 -X POST http://{backend_ip}:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d \'{{"email":"errtest@test.com","password":"Test1234!","name":"Err Test","slug":"err-test-x1"}}\' \
  > /tmp/reg_result.txt 2>&1 &''')

time.sleep(5)

print("\n=== Logs del backend (capturando el error) ===")
print(run('docker logs virtual-tryon-backend 2>&1'))

print("\n=== Resultado del request ===")
print(run('cat /tmp/reg_result.txt 2>/dev/null || echo "sin resultado"'))

print("\n=== Estado final del contenedor ===")
print(run('docker ps --filter name=virtual-tryon-backend --format "{{.Names}} {{.Status}}"'))

client.close()
