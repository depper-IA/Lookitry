import paramiko
import time

HOST = '31.220.18.39'
PORT = 22
USER = 'root'
PASS = 'Travis18456916#'

def run(client, cmd, timeout=60):
    print(f"\n>>> {cmd[:120]}")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode()
    err = stderr.read().decode()
    if out.strip():
        print(out.strip()[:600])
    if err.strip():
        err_lines = [l for l in err.splitlines() if not any(w in l.lower() for w in ['warn', 'notice', 'deprecated'])]
        if err_lines:
            print("ERR:", '\n'.join(err_lines[:10]))
    return out, err

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, port=PORT, username=USER, password=PASS, timeout=15)
print("Conectado al VPS")

# Conectar el contenedor a la red proxy de Traefik
print("\n--- Conectando backend a la red proxy de Traefik ---")
run(client, 'docker network connect proxy virtual-tryon-backend 2>/dev/null || echo "ya conectado o error"')

# Verificar que Traefik puede ver el contenedor
print("\n--- Verificando redes del contenedor ---")
run(client, 'docker inspect virtual-tryon-backend --format "{{json .NetworkSettings.Networks}}" | python3 -c "import sys,json; d=json.load(sys.stdin); print(list(d.keys()))"')

# Verificar la configuración de Traefik (certresolver)
print("\n--- Verificando configuración de Traefik ---")
run(client, 'docker inspect root-traefik-1 --format "{{.Config.Cmd}}" 2>/dev/null | head -5')
run(client, 'docker exec root-traefik-1 traefik version 2>/dev/null | head -3')

# Ver si Traefik ya detectó el backend
print("\n--- Logs de Traefik (últimas líneas) ---")
run(client, 'docker logs root-traefik-1 --tail 20 2>&1')

# Test externo
print("\n--- Test desde el exterior ---")
run(client, 'curl -s -o /dev/null -w "HTTP %{http_code}" http://api.pruebalo.wilkiedevs.com/health 2>/dev/null || echo "DNS no apunta aún al VPS"')

print("\nListo. Pendiente: configurar DNS api.pruebalo.wilkiedevs.com -> 31.220.18.39")
client.close()
