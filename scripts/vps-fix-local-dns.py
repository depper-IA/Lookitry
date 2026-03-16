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

# El resolver local del VPS tiene cacheada la IPv6 vieja de Hostinger
# Solución: cambiar el nameserver del VPS a uno externo (8.8.8.8)
# para que resuelva correctamente

print("=== Resolver actual del VPS ===")
print(run('cat /etc/resolv.conf'))

print("\n=== Cambiando nameserver a 8.8.8.8 ===")
print(run('echo "nameserver 8.8.8.8\nnameserver 1.1.1.1" > /etc/resolv.conf'))
print(run('cat /etc/resolv.conf'))

print("\n=== DNS AAAA después del cambio ===")
print(run('dig +short pruebalo.wilkiedevs.com AAAA'))

print("\n=== Test curl por defecto ===")
print(run('curl -sv --max-time 10 https://pruebalo.wilkiedevs.com/ 2>&1 | grep "Connected to" | head -2'))

print("\n=== Frontend responde Next.js ===")
content = run('curl -s --max-time 10 https://pruebalo.wilkiedevs.com/ 2>/dev/null | grep -o "VirtualTryOn\|_next\|wp-block" | head -3')
print(content)

print("\n=== Test login admin ===")
print(run('curl -s -X POST https://api.pruebalo.wilkiedevs.com/api/admin/auth/login -H "Content-Type: application/json" -d \'{"email":"info.samwilkie@gmail.com","password":"Travis2305*"}\' 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print(\'OK\' if d.get(\'token\') else \'FAIL\')" 2>/dev/null'))

print("\n=== n8n sigue OK ===")
print(run('docker ps --filter name=n8n --format "{{.Names}} {{.Status}}"'))
print(run('curl -s --max-time 5 -o /dev/null -w "%{http_code}" https://n8n.wilkiedevs.com/ 2>/dev/null'))

client.close()
print("\n=== DONE ===")
