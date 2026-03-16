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

acme_path = run('docker volume inspect traefik_data --format "{{.Mountpoint}}"')
acme_file = f"{acme_path}/acme.json"

# Rate limit vence a las 01:00:34 UTC
# Son las ~00:54 UTC ahora, faltan ~7 minutos
print("=== Esperando 8 minutos para que venza el rate limit (01:00:34 UTC)... ===")
print("(Rate limit: 5 failed authorizations per hour)")

for i in range(8):
    time.sleep(60)
    print(f"  {i+1}/8 minutos esperados...")

print("\n=== Rate limit debería haber vencido. Forzando renovación... ===")

# Reiniciar Traefik para que reintente inmediatamente
print(run('cd /root && docker compose restart traefik 2>&1', timeout=30))
time.sleep(15)

print("\n=== Logs Traefik (ACME) ===")
print(run('docker logs root-traefik-1 --since 20s 2>&1 | grep -iE "pruebalo|acme|cert|obtained|error|tls|success|obtain" | head -10'))

time.sleep(15)

print("\n=== Logs Traefik (30s después) ===")
print(run('docker logs root-traefik-1 --since 35s 2>&1 | grep -iE "pruebalo|acme|cert|obtained|error|tls|success|obtain" | head -10'))

# Verificar acme.json
print("\n=== Dominios en acme.json ===")
print(run(f'cat {acme_file} 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); certs=d.get(\'mytlschallenge\',{{}}).get(\'Certificates\',[]) or []; print(\'Total:\', len(certs)); [print(c.get(\'domain\',{{}}).get(\'main\',\'?\')) for c in certs]" 2>/dev/null || echo "error"'))

# Test SSL final
print("\n=== Test SSL pruebalo.wilkiedevs.com ===")
print(run('echo | openssl s_client -connect pruebalo.wilkiedevs.com:443 -servername pruebalo.wilkiedevs.com 2>/dev/null | openssl x509 -noout -dates -issuer 2>/dev/null || echo "NO CERT"'))

# Test HTTP del frontend
print("\n=== Test HTTPS frontend ===")
print(run('curl -s --max-time 10 -o /dev/null -w "%{http_code}" https://pruebalo.wilkiedevs.com/ 2>/dev/null'))

print("\n=== n8n sigue OK ===")
print(run('docker ps --filter name=n8n --format "{{.Names}} {{.Status}}"'))
print(run('curl -s --max-time 5 -o /dev/null -w "%{http_code}" https://n8n.wilkiedevs.com/ 2>/dev/null'))

client.close()
print("\n=== DONE ===")
