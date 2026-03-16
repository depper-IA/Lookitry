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

print("=== Pull del código actualizado ===")
print(run(f'cd /root/virtual-tryon && git pull https://{GITHUB_TOKEN}@github.com/depper-IA/virtual-tryon.git main 2>&1'))

print("\n=== Build del backend ===")
print(run('cd /root/virtual-tryon/backend && npm ci --omit=dev 2>&1 | tail -5', timeout=120))
print(run('cd /root/virtual-tryon/backend && npm run build 2>&1 | tail -10', timeout=120))

print("\n=== Rebuild y restart del contenedor backend ===")
print(run('cd /root/virtual-tryon && docker compose -f docker-compose.backend.yml build --no-cache 2>&1 | tail -10', timeout=180))
print(run('cd /root/virtual-tryon && docker compose -f docker-compose.backend.yml up -d --force-recreate 2>&1', timeout=60))

time.sleep(8)

print("\n=== Estado del backend ===")
print(run('docker ps --filter name=virtual-tryon-backend --format "{{.Names}} {{.Status}}"'))

print("\n=== Logs del backend ===")
print(run('docker logs virtual-tryon-backend --tail 15 2>&1'))

print("\n=== Test POST register ===")
result = run(r"""
bash -c '
curl -s --max-time 15 -X POST http://172.19.0.7:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"newtest@test.com\",\"password\":\"Test1234!\",\"name\":\"New Test\",\"slug\":\"new-test-x1\"}" &
sleep 3
docker logs virtual-tryon-backend --since 5s 2>&1
wait
'
""", timeout=20)
print(result)

client.close()
