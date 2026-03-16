import paramiko

HOST = '31.220.18.39'
PORT = 22
USER = 'root'
PASS = 'Travis18456916#'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, port=PORT, username=USER, password=PASS, timeout=15)

def run(cmd, timeout=15):
    _, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    return out + ('\n' + err if err else '')

print("=== LOGS BACKEND (ultimas 50 lineas) ===")
print(run('docker logs virtual-tryon-backend --tail 50'))

print("\n=== TEST REGISTRO DIRECTO AL BACKEND ===")
print(run('''curl -s -X POST https://api.pruebalo.wilkiedevs.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123","name":"Test Brand","slug":"test-brand"}' '''))

print("\n=== TEST HEALTH ===")
print(run('curl -s https://api.pruebalo.wilkiedevs.com/health'))

print("\n=== CORS HEADERS ===")
print(run('''curl -s -I -X OPTIONS https://api.pruebalo.wilkiedevs.com/api/auth/register \
  -H "Origin: https://pruebalo.wilkiedevs.com" \
  -H "Access-Control-Request-Method: POST" | grep -i "access-control\|cors\|origin"'''))

client.close()
