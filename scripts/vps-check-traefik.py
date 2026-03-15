import paramiko, json

HOST = '31.220.18.39'
PORT = 22
USER = 'root'
PASS = 'Travis18456916#'

def run(client, cmd, timeout=15):
    _, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode()
    err = stderr.read().decode()
    return out, err

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, port=PORT, username=USER, password=PASS, timeout=15)

print("=== Logs recientes de Traefik ===")
out, _ = run(client, 'docker logs root-traefik-1 --since 60s 2>&1')
print(out or "(sin logs nuevos)")

print("\n=== Rutas HTTP en Traefik ===")
out, _ = run(client, 'curl -s http://localhost:8080/api/http/routers')
try:
    routers = json.loads(out)
    for r in routers:
        print(f"  {r.get('name','?'):40} {r.get('rule',''):50} {r.get('status','?')}")
except:
    print(out[:500])

print("\n=== Contenedores corriendo ===")
out, _ = run(client, 'docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"')
print(out)

client.close()
