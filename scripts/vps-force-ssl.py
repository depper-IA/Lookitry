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

# El rate limit pasó (00:48 UTC). Reiniciar Traefik para que reintente obtener el cert
# IMPORTANTE: solo reiniciar Traefik, no tocar n8n ni otros servicios
print("=== Reiniciando Traefik para forzar renovación SSL ===")
print(run('cd /root && docker compose restart traefik 2>&1', timeout=30))

time.sleep(10)

print("\n=== Estado de Traefik ===")
print(run('docker ps --filter name=traefik --format "{{.Names}} {{.Status}}"'))

print("\n=== Logs Traefik (primeros 15s) ===")
print(run('docker logs root-traefik-1 --since 15s 2>&1 | grep -i "pruebalo\|acme\|cert\|obtained\|error" | head -10'))

time.sleep(15)

print("\n=== Logs Traefik (30s después) ===")
print(run('docker logs root-traefik-1 --since 30s 2>&1 | grep -i "pruebalo\|acme\|cert\|obtained\|error\|success" | head -10'))

# Verificar si obtuvo el cert
acme_path = run('docker volume inspect traefik_data --format "{{.Mountpoint}}"')
print("\n=== Dominios en acme.json ===")
print(run(f'cat {acme_path}/acme.json 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); certs=d.get(\'mytlschallenge\',{{}}).get(\'Certificates\',[]) or []; [print(c.get(\'domain\',{{}}).get(\'main\',\'?\')) for c in certs]" 2>/dev/null || echo "vacio"'))

# Verificar que n8n sigue funcionando
print("\n=== n8n sigue funcionando ===")
print(run('docker ps --filter name=n8n --format "{{.Names}} {{.Status}}"'))
print(run('curl -s --max-time 5 -o /dev/null -w "%{http_code}" https://n8n.wilkiedevs.com/ 2>/dev/null || echo "no responde"'))

client.close()
