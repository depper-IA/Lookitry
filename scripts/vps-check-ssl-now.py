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

print("=== SSL actual de pruebalo.wilkiedevs.com ===")
print(run('echo | openssl s_client -connect pruebalo.wilkiedevs.com:443 -servername pruebalo.wilkiedevs.com 2>/dev/null | openssl x509 -noout -dates -issuer -subject 2>/dev/null || echo "NO CERT"'))

print("\n=== HTTP status del frontend ===")
print(run('curl -sv --max-time 10 https://pruebalo.wilkiedevs.com/ 2>&1 | grep -E "< HTTP|SSL|certificate|error|Location|200|301|302" | head -10'))

print("\n=== ¿El frontend carga correctamente? ===")
print(run('curl -s --max-time 10 https://pruebalo.wilkiedevs.com/ 2>/dev/null | head -5'))

print("\n=== Test login admin desde VPS ===")
print(run('curl -s -X POST https://api.pruebalo.wilkiedevs.com/api/admin/auth/login -H "Content-Type: application/json" -d \'{"email":"info.samwilkie@gmail.com","password":"Travis2305*"}\' 2>&1 | python3 -c "import sys,json; d=json.load(sys.stdin); print(\'OK - token:\', d.get(\'token\',\'\')[:30]+\'...\')" 2>/dev/null || echo "error"'))

print("\n=== Test registro usuario desde VPS ===")
import time as t
ts = int(t.time())
print(run(f'curl -s -X POST https://api.pruebalo.wilkiedevs.com/api/auth/register -H "Content-Type: application/json" -d \'{{"email":"testssl{ts}@test.com","password":"Test1234*","name":"TestSSL","slug":"testssl{ts}"}}\' 2>&1 | python3 -c "import sys,json; d=json.load(sys.stdin); print(\'OK - token:\', d.get(\'token\',\'\')[:30]+\'...\')" 2>/dev/null || echo "error"'))

print("\n=== acme.json dominios ===")
acme_path = run('docker volume inspect traefik_data --format "{{.Mountpoint}}"')
print(run(f'cat {acme_path}/acme.json 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); certs=d.get(\'mytlschallenge\',{{}}).get(\'Certificates\',[]) or []; print(\'Total:\', len(certs)); [print(c.get(\'domain\',{{}}).get(\'main\',\'?\')) for c in certs]" 2>/dev/null'))

print("\n=== Logs Traefik recientes ===")
print(run('docker logs root-traefik-1 --since 60s 2>&1 | grep -iE "pruebalo|acme|cert|obtained|error|tls|success" | tail -5'))

client.close()
