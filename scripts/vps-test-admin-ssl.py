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

# Test login admin
print("=== Login admin ===")
print(run('''curl -s --max-time 10 -X POST https://api.pruebalo.wilkiedevs.com/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"info.samwilkie@gmail.com","password":"Travis2305*"}' ''', timeout=15))

# Ver el SSL actual de pruebalo.wilkiedevs.com
print("\n=== SSL pruebalo.wilkiedevs.com (quien lo emite) ===")
print(run('echo | openssl s_client -connect pruebalo.wilkiedevs.com:443 -servername pruebalo.wilkiedevs.com 2>/dev/null | openssl x509 -noout -dates -subject -issuer 2>/dev/null'))

# Ver si el rate limit ya pasó
print("\n=== Logs Traefik SSL recientes ===")
print(run('docker logs root-traefik-1 --since 5m 2>&1 | grep -i "pruebalo\|acme\|429\|cert" | tail -5'))

# Ver cuándo puede reintentar
print("\n=== Próximo reintento permitido ===")
print(run('docker logs root-traefik-1 --since 30m 2>&1 | grep "retry after" | tail -3'))

client.close()
