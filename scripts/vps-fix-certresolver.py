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

# Actualizar docker-compose con el certresolver correcto: mytlschallenge
compose = """services:
  backend:
    build:
      context: /root/virtual-tryon/backend
      dockerfile: Dockerfile
    container_name: virtual-tryon-backend
    restart: unless-stopped
    env_file:
      - /root/virtual-tryon/backend/.env.production
    networks:
      - proxy
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.vt-backend.rule=Host(`api.pruebalo.wilkiedevs.com`)"
      - "traefik.http.routers.vt-backend.entrypoints=websecure"
      - "traefik.http.routers.vt-backend.tls.certresolver=mytlschallenge"
      - "traefik.http.services.vt-backend.loadbalancer.server.port=3001"

networks:
  proxy:
    external: true
"""

run(client, f"cat > /root/virtual-tryon/docker-compose.backend.yml << 'COMPOSEEOF'\n{compose}\nCOMPOSEEOF")

# Recrear el contenedor con la nueva config
print("\n--- Recreando contenedor con certresolver correcto ---")
run(client, 'docker compose -f /root/virtual-tryon/docker-compose.backend.yml down')
run(client, 'docker compose -f /root/virtual-tryon/docker-compose.backend.yml up -d')
time.sleep(4)

print("\n--- Estado ---")
run(client, 'docker ps | grep virtual-tryon')
run(client, 'docker logs virtual-tryon-backend --tail 10')

print("\n--- Logs de Traefik (verificar que no hay errores) ---")
run(client, 'docker logs root-traefik-1 --tail 15 2>&1')

print("\n--- Health check interno ---")
run(client, 'docker exec virtual-tryon-backend wget -qO- http://localhost:3001/health 2>/dev/null')

print("\nPendiente: apuntar DNS api.pruebalo.wilkiedevs.com -> 31.220.18.39")
client.close()
