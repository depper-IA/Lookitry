import paramiko, time

# Servidor de hosting compartido de Hostinger (no el VPS)
# El username es u639440667 según la API
# Necesitamos conectarnos al servidor de hosting compartido

# Primero intentar via SSH al hosting compartido
# Hostinger hosting compartido usa puerto 65002 por defecto
HOST_SHARED = 'srv1.wilkiedevs.com'  # o el servidor de hosting
PORT_SHARED = 65002
USER_SHARED = 'u639440667'

# Alternativamente, el problema puede resolverse simplemente
# eliminando el directorio del subdominio en el hosting compartido
# o deshabilitando el virtual host

# Pero la forma más directa: el sitio de Hostinger responde porque
# tiene un virtual host configurado. Aunque el DNS apunte al VPS,
# si Hostinger tiene un CDN o proxy delante, puede seguir interceptando.

# Verificar qué IP responde realmente
import socket
print("=== Resolución DNS de pruebalo.wilkiedevs.com ===")
try:
    results = socket.getaddrinfo('pruebalo.wilkiedevs.com', 443)
    for r in results:
        print(f"  {r[0].name}: {r[4][0]}")
except Exception as e:
    print(f"Error: {e}")

# Conectar al VPS para verificar qué IP llega realmente
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('31.220.18.39', port=22, username='root', password='Travis18456916#', timeout=15)

def run(cmd, timeout=30):
    _, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    return out + ('\n[STDERR]: ' + err if err else '')

print("\n=== Traceroute a pruebalo.wilkiedevs.com ===")
print(run('curl -sv --max-time 10 https://pruebalo.wilkiedevs.com/ 2>&1 | grep -E "Connected|SSL|certificate|HTTP|Server|platform" | head -10'))

print("\n=== ¿Qué IP responde en el puerto 443? ===")
print(run('curl -sv --max-time 5 --resolve "pruebalo.wilkiedevs.com:443:31.220.18.39" https://pruebalo.wilkiedevs.com/ 2>&1 | grep -E "< HTTP|SSL|certificate|Connected" | head -5'))

print("\n=== ¿Qué responde el VPS directamente? ===")
print(run('curl -s --max-time 5 --resolve "pruebalo.wilkiedevs.com:443:31.220.18.39" https://pruebalo.wilkiedevs.com/ 2>/dev/null | head -3'))

print("\n=== ¿Qué responde la IP de Hostinger? ===")
print(run('curl -s --max-time 5 --resolve "pruebalo.wilkiedevs.com:443:92.112.189.47" https://pruebalo.wilkiedevs.com/ 2>/dev/null | head -3'))

print("\n=== Logs de acceso Traefik (últimas peticiones) ===")
print(run('docker logs root-traefik-1 --since 2m 2>&1 | grep -v "^time=" | grep "pruebalo" | tail -5'))

client.close()
