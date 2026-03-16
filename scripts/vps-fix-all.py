import paramiko, time

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
# PARTE 1: Diagnosticar el error exacto del register
# ============================================================
print("=== POST register con timeout largo ===")
print(run('''curl -s --max-time 15 -X POST http://172.19.0.7:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test999@test.com","password":"Test1234!","name":"Test Brand","slug":"test-brand-999"}' ''', timeout=20))

print("\n=== Logs backend DESPUES del request ===")
print(run('docker logs virtual-tryon-backend --tail 10 2>&1'))

# ============================================================
# PARTE 2: Arreglar SSL del frontend — cambiar a http-01 challenge
# ============================================================
print("\n=== Leyendo traefik.yml actual ===")
traefik_yml = run('cat /root/traefik.yml 2>/dev/null || cat /opt/traefik/traefik.yml 2>/dev/null || find / -name traefik.yml -not -path "*/proc/*" 2>/dev/null | head -3')
print(traefik_yml[:1000])

print("\n=== Buscando docker-compose de Traefik ===")
print(run('find /root /opt -name "docker-compose*.yml" 2>/dev/null | head -10'))

print("\n=== Contenido del directorio raiz ===")
print(run('ls -la /root/'))

client.close()
