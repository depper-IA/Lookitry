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

print("=== Flush DNS cache del VPS ===")
print(run('systemd-resolve --flush-caches 2>/dev/null || resolvectl flush-caches 2>/dev/null || echo "no systemd-resolve"'))
print(run('service nscd restart 2>/dev/null || echo "no nscd"'))

print("\n=== DNS AAAA después del flush ===")
print(run('dig +short pruebalo.wilkiedevs.com AAAA @8.8.8.8'))
print(run('dig +short pruebalo.wilkiedevs.com AAAA'))

print("\n=== Forzar curl con IPv4 ===")
print(run('curl -4 -s --max-time 10 https://pruebalo.wilkiedevs.com/ 2>/dev/null | grep -o "VirtualTryOn\|_next\|wp-block" | head -3'))

print("\n=== Forzar curl con IPv6 del VPS ===")
print(run('curl -6 -s --max-time 10 https://pruebalo.wilkiedevs.com/ 2>/dev/null | grep -o "VirtualTryOn\|_next\|wp-block" | head -3'))

print("\n=== ¿Qué IP usa curl por defecto? ===")
print(run('curl -sv --max-time 10 https://pruebalo.wilkiedevs.com/ 2>&1 | grep "Connected to" | head -2'))

# Verificar que el cert de Traefik es el correcto (no el de Hostinger)
print("\n=== Cert SSL actual (¿Traefik o Hostinger?) ===")
print(run('echo | openssl s_client -connect pruebalo.wilkiedevs.com:443 -servername pruebalo.wilkiedevs.com 2>/dev/null | openssl x509 -noout -dates -issuer -fingerprint 2>/dev/null'))

# Verificar con IP directa del VPS
print("\n=== Cert SSL via IPv4 del VPS directamente ===")
print(run('echo | openssl s_client -connect 31.220.18.39:443 -servername pruebalo.wilkiedevs.com 2>/dev/null | openssl x509 -noout -dates -issuer -fingerprint 2>/dev/null'))

# Verificar con IPv6 del VPS
print("\n=== Cert SSL via IPv6 del VPS ===")
print(run('echo | openssl s_client -connect [2a02:4780:10:1a50::1]:443 -servername pruebalo.wilkiedevs.com 2>/dev/null | openssl x509 -noout -dates -issuer -fingerprint 2>/dev/null'))

# Verificar con IPv6 de Hostinger
print("\n=== Cert SSL via IPv6 de Hostinger ===")
print(run('echo | openssl s_client -connect [2a02:4780:2b:1727:0:261d:171b:2]:443 -servername pruebalo.wilkiedevs.com 2>/dev/null | openssl x509 -noout -dates -issuer -fingerprint 2>/dev/null'))

client.close()
