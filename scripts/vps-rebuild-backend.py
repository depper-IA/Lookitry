import paramiko, time

HOST = '31.220.18.39'
PORT = 22
USER = 'root'
PASS = 'Travis18456916#'

def run(client, cmd, timeout=300):
    print(f"\n>>> {cmd[:100]}")
    _, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode()
    err = stderr.read().decode()
    if out.strip(): print(out.strip()[:600])
    if err.strip():
        lines = [l for l in err.splitlines() if not any(w in l.lower() for w in ['warn','notice','deprecated'])]
        if lines: print("ERR:", '\n'.join(lines[:10]))
    return out, err

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, port=PORT, username=USER, password=PASS, timeout=15)

run(client, 'cd /root/virtual-tryon && git pull origin main')
run(client, 'docker compose -f /root/virtual-tryon/docker-compose.backend.yml build --no-cache 2>&1', timeout=300)
run(client, 'docker compose -f /root/virtual-tryon/docker-compose.backend.yml up -d')
time.sleep(5)
run(client, 'docker ps | grep virtual-tryon')
run(client, 'docker logs virtual-tryon-backend --tail 10')

print("\n--- Test registro ---")
time.sleep(3)
run(client, '''curl -s -X POST https://api.pruebalo.wilkiedevs.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test2@test.com","password":"test1234","name":"Test Brand","slug":"test-brand-2"}' ''')

client.close()
