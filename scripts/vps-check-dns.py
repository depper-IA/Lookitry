import paramiko

HOST = '31.220.18.39'
PORT = 22
USER = 'root'
PASS = 'Travis18456916#'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, port=PORT, username=USER, password=PASS, timeout=15)

def run(client, cmd):
    _, stdout, _ = client.exec_command(cmd, timeout=15)
    return stdout.read().decode().strip()

print("DNS pruebalo.wilkiedevs.com ->", run(client, 'dig +short pruebalo.wilkiedevs.com A @8.8.8.8'))
print("DNS api.pruebalo.wilkiedevs.com ->", run(client, 'dig +short api.pruebalo.wilkiedevs.com A @8.8.8.8'))
print()
print("HTTP pruebalo (80):", run(client, 'curl -s -o /dev/null -w "%{http_code}" http://pruebalo.wilkiedevs.com/ 2>/dev/null'))
print("HTTPS pruebalo (443):", run(client, 'curl -sk -o /dev/null -w "%{http_code}" https://pruebalo.wilkiedevs.com/ 2>/dev/null'))
print("HTTPS api.pruebalo (443):", run(client, 'curl -sk -o /dev/null -w "%{http_code}" https://api.pruebalo.wilkiedevs.com/health 2>/dev/null'))
print()
print("Contenedores:")
print(run(client, 'docker ps --format "{{.Names}} {{.Status}}" | grep virtual-tryon'))

client.close()
