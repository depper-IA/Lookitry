import paramiko, time, json

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

# Limpiar el cert de pruebalo del acme.json para forzar renovación
print("=== Limpiando cert de pruebalo del acme.json ===")
acme_content = run(f'cat {acme_file}')
try:
    acme_data = json.loads(acme_content)
    certs = acme_data.get('mytlschallenge', {}).get('Certificates', []) or []
    new_certs = [c for c in certs if 'pruebalo.wilkiedevs.com' not in str(c.get('domain', {}))]
    acme_data['mytlschallenge']['Certificates'] = new_certs
    new_acme = json.dumps(acme_data)
    new_acme_escaped = new_acme.replace("'", "'\\''")
    result = run(f"echo '{new_acme_escaped}' > {acme_file} && chmod 600 {acme_file}")
    print(f"OK - certs restantes: {[c.get('domain',{}).get('main','?') for c in new_certs]}")
except Exception as e:
    print(f"Error: {e}")

# Reiniciar Traefik
print("\n=== Reiniciando Traefik ===")
print(run('cd /root && docker compose restart traefik 2>&1', timeout=30))

time.sleep(20)

print("\n=== Logs Traefik (ACME) ===")
print(run('docker logs root-traefik-1 --since 25s 2>&1 | grep -iE "pruebalo|acme|cert|obtained|error|tls|success|obtain|rate" | head -10'))

time.sleep(20)

print("\n=== Logs Traefik (45s) ===")
print(run('docker logs root-traefik-1 --since 50s 2>&1 | grep -iE "pruebalo|acme|cert|obtained|error|tls|success|obtain|rate" | head -10'))

print("\n=== Dominios en acme.json ===")
print(run(f'cat {acme_file} 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); certs=d.get(\'mytlschallenge\',{{}}).get(\'Certificates\',[]) or []; print(\'Total:\', len(certs)); [print(c.get(\'domain\',{{}}).get(\'main\',\'?\')) for c in certs]" 2>/dev/null'))

print("\n=== SSL de pruebalo.wilkiedevs.com ===")
print(run('echo | openssl s_client -connect pruebalo.wilkiedevs.com:443 -servername pruebalo.wilkiedevs.com 2>/dev/null | openssl x509 -noout -dates -issuer 2>/dev/null || echo "NO CERT"'))

print("\n=== Frontend responde Next.js ===")
content = run('curl -s --max-time 10 https://pruebalo.wilkiedevs.com/ 2>/dev/null | grep -o "VirtualTryOn\|_next\|wp-block" | head -3')
print(content)

print("\n=== n8n OK ===")
print(run('docker ps --filter name=n8n --format "{{.Names}} {{.Status}}"'))
print(run('curl -s --max-time 5 -o /dev/null -w "%{http_code}" https://n8n.wilkiedevs.com/ 2>/dev/null'))

client.close()
print("\n=== DONE ===")
