import paramiko, time

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

# Ver si el rate limit ya pasó y Traefik obtuvo el cert
print("=== Logs Traefik (ultimos 5 min) ===")
print(run('docker logs root-traefik-1 --since 5m 2>&1 | grep -i "pruebalo\|acme\|cert\|obtained\|success" | tail -10'))

# Ver si el cert ya está en acme.json
acme_path = run('docker volume inspect traefik_data --format "{{.Mountpoint}}"')
print("\n=== Dominios en acme.json ahora ===")
print(run(f'cat {acme_path}/acme.json 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); certs=d.get(\'mytlschallenge\',{{}}).get(\'Certificates\',[]) or []; [print(c.get(\'domain\',{{}}).get(\'main\',\'?\')) for c in certs]" 2>/dev/null || echo "vacio"'))

# Test HTTPS del frontend
print("\n=== Test HTTPS frontend ===")
print(run('curl -s --max-time 5 -o /dev/null -w "%{http_code} %{ssl_verify_result}" https://pruebalo.wilkiedevs.com/ 2>/dev/null || echo "sin respuesta"'))

# Ver si el httpChallenge está funcionando
print("\n=== Verificar httpChallenge en docker-compose ===")
print(run('grep -A2 "acme" /root/docker-compose.yml | head -8'))

client.close()
