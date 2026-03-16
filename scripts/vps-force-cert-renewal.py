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

print("=== Verificar DNS actual de pruebalo.wilkiedevs.com ===")
print(run('dig +short pruebalo.wilkiedevs.com A'))
print(run('dig +short pruebalo.wilkiedevs.com AAAA'))

print("\n=== ¿A qué IP llega el HTTPS ahora? ===")
print(run('echo | openssl s_client -connect pruebalo.wilkiedevs.com:443 -servername pruebalo.wilkiedevs.com 2>/dev/null | openssl x509 -noout -dates -issuer -subject 2>/dev/null || echo "NO CERT"'))

# Verificar rate limit actual
print("\n=== Logs Traefik (rate limit) ===")
print(run('docker logs root-traefik-1 --since 5m 2>&1 | grep -iE "rate|retry after|pruebalo" | tail -3'))

# Reiniciar Traefik para forzar reintento
print("\n=== Reiniciando Traefik para forzar reintento ACME ===")
print(run('cd /root && docker compose restart traefik 2>&1', timeout=30))

time.sleep(15)

print("\n=== Logs Traefik (ACME) ===")
print(run('docker logs root-traefik-1 --since 20s 2>&1 | grep -iE "pruebalo|acme|cert|obtained|error|tls|success|obtain|rate" | head -10'))

time.sleep(20)

print("\n=== Logs Traefik (40s después) ===")
print(run('docker logs root-traefik-1 --since 45s 2>&1 | grep -iE "pruebalo|acme|cert|obtained|error|tls|success|obtain|rate" | head -10'))

print("\n=== Dominios en acme.json ===")
print(run(f'cat {acme_file} 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); certs=d.get(\'mytlschallenge\',{{}}).get(\'Certificates\',[]) or []; print(\'Total:\', len(certs)); [print(c.get(\'domain\',{{}}).get(\'main\',\'?\')) for c in certs]" 2>/dev/null || echo "error"'))

print("\n=== SSL final de pruebalo.wilkiedevs.com ===")
print(run('echo | openssl s_client -connect pruebalo.wilkiedevs.com:443 -servername pruebalo.wilkiedevs.com 2>/dev/null | openssl x509 -noout -dates -issuer 2>/dev/null || echo "NO CERT"'))

print("\n=== n8n sigue OK ===")
print(run('docker ps --filter name=n8n --format "{{.Names}} {{.Status}}"'))
print(run('curl -s --max-time 5 -o /dev/null -w "%{http_code}" https://n8n.wilkiedevs.com/ 2>/dev/null'))

client.close()
print("\n=== DONE ===")
