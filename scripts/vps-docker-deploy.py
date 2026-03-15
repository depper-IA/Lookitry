import paramiko
import time

HOST = '31.220.18.39'
PORT = 22
USER = 'root'
PASS = 'Travis18456916#'

def run(client, cmd, timeout=300):
    print(f"\n>>> {cmd[:120]}")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode()
    err = stderr.read().decode()
    if out.strip():
        print(out.strip()[:800])
    if err.strip():
        err_lines = [l for l in err.splitlines() if not any(w in l.lower() for w in ['warn', 'notice', 'deprecated', 'info'])]
        if err_lines:
            print("ERR:", '\n'.join(err_lines[:15]))
    return out, err

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, port=PORT, username=USER, password=PASS, timeout=15)
print("Conectado al VPS")

# 1. Detectar la red de Docker que usa Traefik
print("\n--- Detectando red de Traefik ---")
out, _ = run(client, 'docker network ls')
print("Redes disponibles:", out)

out, _ = run(client, 'docker inspect root-traefik-1 --format "{{json .NetworkSettings.Networks}}" 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print(list(d.keys()))"')
traefik_network = 'traefik' if 'traefik' in out else 'root_default'
print(f"Red de Traefik detectada: {traefik_network}")

# 2. Crear Dockerfile para el backend
print("\n--- Creando Dockerfile ---")
dockerfile = """FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["node", "dist/index.js"]
"""
run(client, f"cat > /root/virtual-tryon/backend/Dockerfile << 'DOCKEREOF'\n{dockerfile}\nDOCKEREOF")

# 3. Crear .env de producción
print("\n--- Escribiendo .env de producción ---")
env_vars = {
    "PORT": "3001",
    "NODE_ENV": "production",
    "SUPABASE_URL": "https://vkdooutklowctuudjnkl.supabase.co",
    "SUPABASE_ANON_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrZG9vdXRrbG93Y3R1dWRqbmtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3NjU2NjUsImV4cCI6MjA4NjM0MTY2NX0.ysvYQtcl2hCEOJVczXG-4knzt6oOd74z9iE3Ci_KOWM",
    "SUPABASE_SERVICE_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrZG9vdXRrbG93Y3R1dWRqbmtsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDc2NTY2NSwiZXhwIjoyMDg2MzQxNjY1fQ.NxXV0Too3Iadb0FGuC8powPUuaMPiF1TKIUVtGMyFpg",
    "JWT_SECRET": "virtual-tryon-saas-secret-key-change-in-production-2026",
    "JWT_EXPIRES_IN": "7d",
    "N8N_WEBHOOK_URL": "https://n8n.wilkiedevs.com/webhook/tryon",
    "N8N_API_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NGUxZTYyYi1kY2M0LTRiZGUtOWFjZS02OTBmMjAxMGIyMDAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiZWE2NmI1N2ItNTBiNS00ZTViLWJhYzYtZDE2MWFkM2NkZTkzIiwiaWF0IjoxNzczMjc5MzMyfQ.ZuYsz4K4ifpp9ho_nZzpDypTy49_APNx9hkecKridJw",
    "N8N_TIMEOUT": "90000",
    "N8N_BEARER_TOKEN": "Travis2305**",
    "N8N_HEADER_NAME": "Authorization",
    "OPENROUTER_API_KEY": "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",
    "MAX_FILE_SIZE": "5242880",
    "ALLOWED_FILE_TYPES": "image/jpeg,image/png,image/webp",
    "SMTP_HOST": "smtp.hostinger.com",
    "SMTP_PORT": "465",
    "SMTP_SECURE": "true",
    "SMTP_USER": "info@pruebalo.wilkiedevs.com",
    "SMTP_PASS": "Travis2305*",
    "SMTP_FROM": "Virtual Try-On SaaS <info@pruebalo.wilkiedevs.com>",
    "FRONTEND_URL": "https://pruebalo.wilkiedevs.com",
    "CORS_ORIGIN": "https://pruebalo.wilkiedevs.com",
    "WOMPI_PUBLIC_KEY": "pub_test_3X84dh5ArV79atO6WwNFznjK3kv45JI2",
    "WOMPI_PRIVATE_KEY": "prv_test_ZrBx84WuuB6V7NDPf7Ed9XyRYhg77J1s",
    "WOMPI_EVENTS_SECRET": "test_events_ywYgTECX1VdqCmLiGPxeUYXzaJqIAVsg",
    "WOMPI_INTEGRITY_SECRET": "test_integrity_9tTBgHdvYU2yPEIapYGbeFvNCqrlfLQG",
    "WOMPI_ENABLED": "true",
}

run(client, 'printf "" > /root/virtual-tryon/backend/.env.production')
for k, v in env_vars.items():
    escaped_v = v.replace("'", "'\\''")
    run(client, f"echo '{k}={escaped_v}' >> /root/virtual-tryon/backend/.env.production")

run(client, 'wc -l /root/virtual-tryon/backend/.env.production')

# 4. Crear docker-compose para el backend
print("\n--- Creando docker-compose.yml ---")
compose = f"""services:
  backend:
    build:
      context: /root/virtual-tryon/backend
      dockerfile: Dockerfile
    container_name: virtual-tryon-backend
    restart: unless-stopped
    env_file:
      - /root/virtual-tryon/backend/.env.production
    networks:
      - {traefik_network}
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.vt-backend.rule=Host(`api.pruebalo.wilkiedevs.com`)"
      - "traefik.http.routers.vt-backend.entrypoints=websecure"
      - "traefik.http.routers.vt-backend.tls.certresolver=letsencrypt"
      - "traefik.http.services.vt-backend.loadbalancer.server.port=3001"

networks:
  {traefik_network}:
    external: true
"""

run(client, f"cat > /root/virtual-tryon/docker-compose.backend.yml << 'COMPOSEEOF'\n{compose}\nCOMPOSEEOF")
run(client, 'cat /root/virtual-tryon/docker-compose.backend.yml')

# 5. Build y deploy
print("\n--- Build de imagen Docker (puede tardar 2-3 min) ---")
out, err = run(client, 'docker compose -f /root/virtual-tryon/docker-compose.backend.yml build --no-cache 2>&1', timeout=300)

if 'error' in out.lower() and 'successfully' not in out.lower():
    print("\nERROR en el build. Revisando...")
    client.close()
    exit(1)

print("\n--- Iniciando contenedor ---")
run(client, 'docker compose -f /root/virtual-tryon/docker-compose.backend.yml up -d')
time.sleep(5)

print("\n--- Estado del contenedor ---")
run(client, 'docker ps | grep virtual-tryon')
run(client, 'docker logs virtual-tryon-backend --tail 30')

print("\n--- Health check interno ---")
time.sleep(3)
run(client, 'docker exec virtual-tryon-backend wget -qO- http://localhost:3001/health 2>/dev/null || curl -s http://localhost:3001/health')

print("\nDeploy completado. El backend debería estar disponible en https://api.pruebalo.wilkiedevs.com")
print("(Requiere que el DNS de api.pruebalo.wilkiedevs.com apunte a 31.220.18.39)")
client.close()
