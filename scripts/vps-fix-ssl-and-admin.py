import paramiko, time, json

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

# ============================================================
# PARTE 1: SSL del frontend — ver estado actual
# ============================================================
print("=== SSL pruebalo.wilkiedevs.com ===")
print(run('echo | openssl s_client -connect pruebalo.wilkiedevs.com:443 -servername pruebalo.wilkiedevs.com 2>/dev/null | openssl x509 -noout -dates -subject 2>/dev/null || echo "sin certificado"'))

print("\n=== Logs Traefik SSL (ultimos 2 min) ===")
print(run('docker logs root-traefik-1 --since 2m 2>&1 | grep -i "pruebalo\|acme\|cert\|error" | tail -10'))

# ============================================================
# PARTE 2: Test del register via HTTPS (ahora que el backend funciona)
# ============================================================
print("\n=== Test register via HTTPS ===")
print(run('''curl -s --max-time 15 -X POST https://api.pruebalo.wilkiedevs.com/api/auth/register \
  -H "Content-Type: application/json" \
  -H "Origin: https://pruebalo.wilkiedevs.com" \
  -d '{"email":"newuser2@test.com","password":"Test1234!","name":"New User","slug":"new-user-2"}' ''', timeout=20))

# ============================================================
# PARTE 3: Admin — ver si la tabla admins existe en Supabase
# ============================================================
print("\n=== Test login admin via HTTPS ===")
print(run('''curl -s --max-time 10 -X POST https://api.pruebalo.wilkiedevs.com/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"info.samwilkie@gmail.com","password":"Travis2305*"}' ''', timeout=15))

# Ver qué rutas admin existen
print("\n=== Rutas admin disponibles ===")
print(run('docker exec virtual-tryon-backend grep -r "router\." /app/dist/routes/admin.routes.js 2>/dev/null | head -15'))

client.close()
