import paramiko, time, threading

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
# PARTE 1: Ver qué pasa con el register — logs en tiempo real
# ============================================================
print("=== Haciendo POST register y capturando logs ===")

# Hacer el request y capturar logs inmediatamente después
result = run('''
node -e "
const http = require('http');
const data = JSON.stringify({email:'test@test.com',password:'Test1234!',name:'Test Brand',slug:'test-brand-x1'});
const options = {hostname:'172.19.0.7',port:3001,path:'/api/auth/register',method:'POST',headers:{'Content-Type':'application/json','Content-Length':data.length}};
const req = http.request(options, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => { console.log('STATUS:', res.statusCode); console.log('BODY:', body); });
});
req.on('error', e => console.log('ERROR:', e.message));
req.setTimeout(10000, () => { console.log('TIMEOUT'); req.destroy(); });
req.write(data);
req.end();
" 2>&1
''', timeout=15)
print(result)

print("\n=== Logs backend después del request ===")
print(run('docker logs virtual-tryon-backend --tail 15 2>&1'))

# ============================================================
# PARTE 2: Arreglar SSL — cambiar tlsChallenge a httpChallenge
# ============================================================
print("\n=== Actualizando Traefik para usar httpChallenge ===")

# Leer el docker-compose actual
compose = run('cat /root/docker-compose.yml')

# Reemplazar tlsChallenge por httpChallenge
new_compose = compose.replace(
    '--certificatesresolvers.mytlschallenge.acme.tlschallenge=true',
    '--certificatesresolvers.mytlschallenge.acme.httpchallenge=true\n      - --certificatesresolvers.mytlschallenge.acme.httpchallenge.entrypoint=web'
)

# Escribir el nuevo compose
print(run(f'''cat > /root/docker-compose.yml << 'ENDOFFILE'
{new_compose}
ENDOFFILE'''))

print("\n=== Verificando cambio ===")
print(run('grep -A2 "acme" /root/docker-compose.yml | head -10'))

# Borrar el archivo acme.json para forzar renovación limpia
print("\n=== Borrando acme.json para renovación limpia ===")
print(run('docker volume inspect traefik_data --format "{{.Mountpoint}}"'))
acme_path = run('docker volume inspect traefik_data --format "{{.Mountpoint}}"')
print(run(f'ls -la {acme_path}/ 2>/dev/null'))
print(run(f'rm -f {acme_path}/acme.json && echo "borrado" || echo "no existia"'))

# Reiniciar Traefik
print("\n=== Reiniciando Traefik ===")
print(run('cd /root && docker compose up -d traefik 2>&1', timeout=30))

time.sleep(5)
print("\n=== Estado de Traefik ===")
print(run('docker ps --filter name=traefik --format "{{.Names}} {{.Status}}"'))

client.close()
