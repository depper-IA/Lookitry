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

# El error dice: "Invalid response from http://pruebalo.wilkiedevs.com/.well-known/acme-challenge/...: 404"
# Esto significa que Let's Encrypt SÍ llega al servidor por HTTP,
# pero recibe 404. 
# 
# Posibles causas:
# 1. El router http-catchall redirige a HTTPS antes de que Traefik responda al challenge
# 2. El frontend container responde 404 al path /.well-known/acme-challenge/
# 3. Traefik no está manejando el challenge correctamente
#
# Verificar: ¿qué responde el servidor en HTTP para ese path?

print("=== Test HTTP directo al challenge path ===")
print(run('curl -v --max-time 5 "http://pruebalo.wilkiedevs.com/.well-known/acme-challenge/test123" 2>&1 | grep -E "< HTTP|Location|301|302|404|200"'))

print("\n=== Test HTTP sin redirect ===")
print(run('curl -v --max-time 5 --no-location "http://pruebalo.wilkiedevs.com/.well-known/acme-challenge/test123" 2>&1 | head -20'))

print("\n=== Routers activos en Traefik ===")
print(run('curl -s http://localhost:8080/api/http/routers 2>/dev/null | python3 -c "import sys,json; routers=json.load(sys.stdin); [print(r[\'name\'], r.get(\'rule\',\'\'), r.get(\'entryPoints\',[]), r.get(\'status\',\'\')) for r in routers]" 2>/dev/null | head -20'))

print("\n=== Middlewares activos en Traefik ===")
print(run('curl -s http://localhost:8080/api/http/middlewares 2>/dev/null | python3 -c "import sys,json; mw=json.load(sys.stdin); [print(m[\'name\'], m.get(\'type\',\'\')) for m in mw]" 2>/dev/null | head -10'))

print("\n=== Logs Traefik completos (últimos 5s) ===")
print(run('docker logs root-traefik-1 --since 5s 2>&1 | head -20'))

# El problema puede ser que el router http-catchall tiene prioridad 1
# pero el challenge de Traefik tiene prioridad aún más baja
# O que el frontend container está respondiendo al path

print("\n=== ¿El frontend responde al challenge? ===")
print(run('curl -s --max-time 5 -H "Host: pruebalo.wilkiedevs.com" http://localhost:3000/.well-known/acme-challenge/test 2>&1 | head -5'))

# Verificar si hay algún router HTTP para pruebalo.wilkiedevs.com
print("\n=== Router vt-frontend en Traefik ===")
print(run('curl -s http://localhost:8080/api/http/routers 2>/dev/null | python3 -c "import sys,json; routers=json.load(sys.stdin); [print(json.dumps(r, indent=2)) for r in routers if \'pruebalo\' in str(r)]" 2>/dev/null'))

client.close()
