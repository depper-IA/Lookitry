import paramiko, json

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

# 1. Leer el docker-compose.yml principal
print("=== /root/docker-compose.yml ===")
print(run('cat /root/docker-compose.yml'))

# 2. Ver el docker-compose del virtual-tryon
print("\n=== /root/virtual-tryon/docker-compose.yml ===")
print(run('cat /root/virtual-tryon/docker-compose.yml 2>/dev/null || echo "no existe"'))

# 3. Ver el .env del virtual-tryon
print("\n=== /root/virtual-tryon/.env (sin secretos) ===")
print(run('cat /root/virtual-tryon/.env 2>/dev/null | grep -v "KEY\|SECRET\|PASSWORD\|TOKEN\|PASS" || echo "no existe"'))

# 4. Test del register con curl desde dentro del contenedor backend
print("\n=== Register desde dentro del backend ===")
print(run('''docker exec virtual-tryon-backend sh -c 'curl -s --max-time 10 -X POST http://localhost:3001/api/auth/register -H "Content-Type: application/json" -d "{\"email\":\"test@test.com\",\"password\":\"Test1234!\",\"name\":\"Test\",\"slug\":\"test-slug\"}" 2>&1' '''))

client.close()
