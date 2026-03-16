import paramiko

HOST = '31.220.18.39'
PORT = 22
USER = 'root'
PASS = 'Travis18456916#'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, port=PORT, username=USER, password=PASS, timeout=15)

def run(cmd, timeout=15):
    _, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    return stdout.read().decode().strip()

print("=== DNS AAAA desde distintos resolvers ===")
print("Google (8.8.8.8):", run('dig +short pruebalo.wilkiedevs.com AAAA @8.8.8.8'))
print("Cloudflare (1.1.1.1):", run('dig +short pruebalo.wilkiedevs.com AAAA @1.1.1.1'))
print("Local:", run('dig +short pruebalo.wilkiedevs.com AAAA'))

print("\n=== ¿El VPS tiene IPv6 activo? ===")
print(run('ip -6 addr show scope global | grep inet6'))

print("\n=== Conectividad IPv6 del VPS ===")
print(run('ping6 -c 2 2a02:4780:10:1a50::1 2>/dev/null || echo "no ping6"'))

print("\n=== ¿Traefik escucha en IPv6? ===")
print(run('ss -tlnp | grep -E ":80|:443"'))

client.close()
