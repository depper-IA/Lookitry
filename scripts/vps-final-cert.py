import paramiko, time, subprocess

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

acme_path = run('docker volume inspect traefik_data --format "{{.Mountpoint}}"')
acme_file = f"{acme_path}/acme.json"

# Esperar 3 minutos: rate limit vence a 01:00:35 UTC y DNS propaga
print("=== Esperando 3 minutos (rate limit + DNS propagation)... ===")
for i in range(3):
    time.sleep(60)
    print(f"  {i+1}/3 minutos...")

print("\n=== DNS actual de pruebalo.wilkiedevs.com ===")
print(run('dig +short pruebalo.wilkiedevs.com AAAA @8.8.8.8'))
print(run('dig +short pruebalo.wilkiedevs.com A @8.8.8.8'))

# Reiniciar Traefik para forzar reintento ACME
print("\n=== Reiniciando Traefik ===")
print(run('cd /root && docker compose restart traefik 2>&1', timeout=30))

time.sleep(20)

print("\n=== Logs Traefik (ACME) ===")
print(run('docker logs root-traefik-1 --since 25s 2>&1 | grep -iE "pruebalo|acme|cert|obtained|error|tls|success|obtain|rate" | head -10'))

time.sleep(20)

print("\n=== Logs Traefik (45s) ===")
print(run('docker logs root-traefik-1 --since 50s 2>&1 | grep -iE "pruebalo|acme|cert|obtained|error|tls|success|obtain|rate" | head -10'))

print("\n=== Dominios en acme.json ===")
print(run(f'cat {acme_file} 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); certs=d.get(\'mytlschallenge\',{{}}).get(\'Certificates\',[]) or []; print(\'Total:\', len(certs)); [print(c.get(\'domain\',{{}}).get(\'main\',\'?\')) for c in certs]" 2>/dev/null || echo "error"'))

print("\n=== SSL de pruebalo.wilkiedevs.com ===")
print(run('echo | openssl s_client -connect pruebalo.wilkiedevs.com:443 -servername pruebalo.wilkiedevs.com 2>/dev/null | openssl x509 -noout -dates -issuer 2>/dev/null || echo "NO CERT"'))

print("\n=== Test HTTPS frontend ===")
result = run('curl -s --max-time 10 -o /dev/null -w "%{http_code}" https://pruebalo.wilkiedevs.com/ 2>/dev/null')
print(f"HTTP status: {result}")

# Verificar que sirve Next.js y no WordPress
content = run('curl -s --max-time 10 https://pruebalo.wilkiedevs.com/ 2>/dev/null | head -3')
print(f"Contenido: {content}")
if 'wp-' in content.lower() or 'wordpress' in content.lower():
    print("ADVERTENCIA: Sigue sirviendo WordPress de Hostinger")
elif '<!DOCTYPE html>' in content or 'next' in content.lower():
    print("OK: Sirviendo Next.js correctamente")

print("\n=== n8n sigue OK ===")
print(run('docker ps --filter name=n8n --format "{{.Names}} {{.Status}}"'))
print(run('curl -s --max-time 5 -o /dev/null -w "%{http_code}" https://n8n.wilkiedevs.com/ 2>/dev/null'))

client.close()
print("\n=== DONE ===")
