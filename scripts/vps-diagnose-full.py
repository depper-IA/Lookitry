import paramiko, time, json

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

print("=== 1. Estado de contenedores ===")
print(run('docker ps --format "{{.Names}} {{.Status}} {{.Ports}}"'))

print("\n=== 2. Cert SSL actual de pruebalo.wilkiedevs.com ===")
print(run('echo | openssl s_client -connect pruebalo.wilkiedevs.com:443 -servername pruebalo.wilkiedevs.com 2>/dev/null | openssl x509 -noout -dates -issuer 2>/dev/null || echo "NO CERT"'))

print("\n=== 3. HTTP check pruebalo.wilkiedevs.com ===")
print(run('curl -sv --max-time 10 https://pruebalo.wilkiedevs.com/ 2>&1 | grep -E "< HTTP|SSL|certificate|error|Location" | head -10'))

print("\n=== 4. Logs Traefik recientes (errores/acme) ===")
print(run('docker logs root-traefik-1 --tail 30 2>&1 | grep -iE "pruebalo|acme|cert|error|rate|obtain|http|challenge" | head -20'))

print("\n=== 5. Config Traefik httpChallenge ===")
print(run('cat /root/docker-compose.yml | grep -A5 -B2 "certificatesResolvers\|httpChallenge\|tlsChallenge\|acme"'))

print("\n=== 6. CORS config del backend ===")
print(run('cat /root/virtual-tryon/backend/.env.production | grep -i "cors\|origin\|frontend\|url"'))

print("\n=== 7. Variables de entorno del frontend ===")
print(run('docker exec virtual-tryon-frontend env | grep -i "api\|url\|next_public" 2>/dev/null || echo "no disponible"'))

print("\n=== 8. Test API desde el frontend container ===")
print(run('docker exec virtual-tryon-frontend wget -qO- --timeout=5 https://api.pruebalo.wilkiedevs.com/api/health 2>&1 || echo "fallo"'))

print("\n=== 9. Test registro desde VPS ===")
import time as t
ts = int(t.time())
print(run(f'curl -s -X POST https://api.pruebalo.wilkiedevs.com/api/auth/register -H "Content-Type: application/json" -d \'{{"email":"test{ts}@test.com","password":"Test1234*","name":"Test"}}\' 2>&1 | head -5'))

print("\n=== 10. Test admin login desde VPS ===")
print(run('curl -s -X POST https://api.pruebalo.wilkiedevs.com/api/admin/auth/login -H "Content-Type: application/json" -d \'{"email":"info.samwilkie@gmail.com","password":"Travis2305*"}\' 2>&1 | head -5'))

print("\n=== 11. n8n sigue OK ===")
print(run('docker ps --filter name=n8n --format "{{.Names}} {{.Status}}"'))

client.close()
print("\n=== DIAGNÓSTICO COMPLETO ===")
