import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

host = '31.220.18.39'
user = 'root'
password = 'Travis18456916#'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=password, timeout=15)

def run(cmd, timeout=30):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    return (out + err).strip()

print("=" * 60)
print("STEP 1: Redis queue - trabajos pendientes")
print("=" * 60)
print(run('docker exec root-redis-1 redis-cli LLEN generation-queue 2>&1'))
print(run('docker exec root-redis-1 redis-cli LRANGE generation-queue 0 5 2>&1'))

print("\n" + "=" * 60)
print("STEP 2: Health endpoint interno (dentro de red proxy)")
print("=" * 60)
print(run('docker exec traefik curl -s -o /dev/null -w "%{http_code}" http://lookitry-backend:3001/health 2>&1'))
print(run('docker exec traefik curl -s http://lookitry-backend:3001/health 2>&1'))

print("\n" + "=" * 60)
print("STEP 3: Logs n8n (ultimas 30 lineas)")
print("=" * 60)
print(run('docker logs root-n8n-1 --tail 30 2>&1'))

print("\n" + "=" * 60)
print("STEP 4: n8n health desde contenedor")
print("=" * 60)
print(run('docker exec root-n8n-1 wget -q -O - --timeout=5 http://localhost:5678/healthz 2>&1 || echo "FAILED"'))

print("\n" + "=" * 60)
print("STEP 5: Conexion n8n -> backend desde n8n")
print("=" * 60)
print(run('docker exec root-n8n-1 wget -q -O - --timeout=5 http://lookitry-backend:3001/health 2>&1 || echo "FAILED"'))

print("\n" + "=" * 60)
print("STEP 6: LOGS TRAEFIK para peticiones 502 (backend)")
print("=" * 60)
print(run('docker logs traefik --tail 100 2>&1 | grep -E "(502|backend|lookitry)" || echo "Sin matches"'))

client.close()
print("\n[OK]")
