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

print("=== 1. SSL del frontend ===")
print(run('echo | openssl s_client -connect pruebalo.wilkiedevs.com:443 -servername pruebalo.wilkiedevs.com 2>/dev/null | openssl x509 -noout -dates -issuer 2>/dev/null'))

print("\n=== 2. Frontend carga Next.js ===")
content = run('curl -s --max-time 10 https://pruebalo.wilkiedevs.com/ 2>/dev/null | grep -i "next\|VirtualTryOn\|pruebalo\|_next" | head -3')
print(content or run('curl -s --max-time 10 https://pruebalo.wilkiedevs.com/ 2>/dev/null | head -5'))

print("\n=== 3. Login admin ===")
print(run('curl -s -X POST https://api.pruebalo.wilkiedevs.com/api/admin/auth/login -H "Content-Type: application/json" -d \'{"email":"info.samwilkie@gmail.com","password":"Travis2305*"}\' 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print(\'OK\' if d.get(\'token\') else \'FAIL\', d.get(\'admin\',{}).get(\'role\',\'\'))" 2>/dev/null'))

print("\n=== 4. Registro usuario ===")
import time as t
ts = int(t.time())
print(run(f'curl -s -X POST https://api.pruebalo.wilkiedevs.com/api/auth/register -H "Content-Type: application/json" -d \'{{"email":"verify{ts}@test.com","password":"Test1234*","name":"Verify Test","slug":"verify{ts}"}}\' 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print(\'OK\' if d.get(\'token\') else \'FAIL:\', d.get(\'message\',\'\'))" 2>/dev/null'))

print("\n=== 5. CORS: petición desde origen del frontend ===")
print(run('curl -s -X POST https://api.pruebalo.wilkiedevs.com/api/admin/auth/login -H "Content-Type: application/json" -H "Origin: https://pruebalo.wilkiedevs.com" -d \'{"email":"info.samwilkie@gmail.com","password":"Travis2305*"}\' -v 2>&1 | grep -iE "access-control|cors|< HTTP" | head -5'))

print("\n=== 6. Todos los contenedores ===")
print(run('docker ps --format "{{.Names}} {{.Status}}"'))

client.close()
