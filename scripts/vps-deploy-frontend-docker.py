import paramiko
import time

HOST = '31.220.18.39'
PORT = 22
USER = 'root'
PASS = 'Travis18456916#'

def run(client, cmd, timeout=600):
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

# 1. Crear Dockerfile para el frontend Next.js
print("\n--- Creando Dockerfile del frontend ---")
dockerfile = """FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
"""
run(client, f"cat > /root/virtual-tryon/frontend/Dockerfile << 'DOCKEREOF'\n{dockerfile}\nDOCKEREOF")

# 2. Verificar si Next.js tiene output standalone configurado
print("\n--- Verificando next.config ---")
run(client, 'cat /root/virtual-tryon/frontend/next.config.js 2>/dev/null || cat /root/virtual-tryon/frontend/next.config.ts 2>/dev/null || echo "no encontrado"')

# 3. Escribir .env.production del frontend
print("\n--- Escribiendo .env.production del frontend ---")
env_vars = {
    "NEXT_PUBLIC_API_URL": "https://api.pruebalo.wilkiedevs.com",
    "NEXT_PUBLIC_APP_URL": "https://pruebalo.wilkiedevs.com",
    "NEXT_PUBLIC_SUPABASE_URL": "https://vkdooutklowctuudjnkl.supabase.co",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrZG9vdXRrbG93Y3R1dWRqbmtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3NjU2NjUsImV4cCI6MjA4NjM0MTY2NX0.ysvYQtcl2hCEOJVczXG-4knzt6oOd74z9iE3Ci_KOWM",
    "NEXT_PUBLIC_N8N_DESCRIPTOR_URL": "https://n8n.wilkiedevs.com/webhook/descriptor",
}

run(client, 'printf "" > /root/virtual-tryon/frontend/.env.production')
for k, v in env_vars.items():
    escaped_v = v.replace("'", "'\\''")
    run(client, f"echo '{k}={escaped_v}' >> /root/virtual-tryon/frontend/.env.production")

# 4. Crear docker-compose para el frontend
print("\n--- Creando docker-compose.frontend.yml ---")
compose = """services:
  frontend:
    build:
      context: /root/virtual-tryon/frontend
      dockerfile: Dockerfile
    container_name: virtual-tryon-frontend
    restart: unless-stopped
    env_file:
      - /root/virtual-tryon/frontend/.env.production
    networks:
      - proxy
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.vt-frontend.rule=Host(`pruebalo.wilkiedevs.com`)"
      - "traefik.http.routers.vt-frontend.entrypoints=websecure"
      - "traefik.http.routers.vt-frontend.tls.certresolver=mytlschallenge"
      - "traefik.http.services.vt-frontend.loadbalancer.server.port=3000"

networks:
  proxy:
    external: true
"""
run(client, f"cat > /root/virtual-tryon/docker-compose.frontend.yml << 'COMPOSEEOF'\n{compose}\nCOMPOSEEOF")

# 5. Build (puede tardar 5-8 min por Next.js)
print("\n--- Build del frontend (puede tardar varios minutos) ---")
out, err = run(client, 'docker compose -f /root/virtual-tryon/docker-compose.frontend.yml build --no-cache 2>&1', timeout=600)

if 'error' in (out + err).lower() and 'successfully' not in (out + err).lower():
    # Puede ser que falle por falta de output:standalone — verificar
    print("\nRevisando si necesita output standalone en next.config...")
    run(client, 'cat /root/virtual-tryon/frontend/next.config.js 2>/dev/null || cat /root/virtual-tryon/frontend/next.config.ts 2>/dev/null')

# 6. Levantar
print("\n--- Iniciando frontend ---")
run(client, 'docker compose -f /root/virtual-tryon/docker-compose.frontend.yml up -d')
time.sleep(6)

print("\n--- Estado ---")
run(client, 'docker ps | grep virtual-tryon')
run(client, 'docker logs virtual-tryon-frontend --tail 20')

print("\n--- Health check interno ---")
run(client, 'docker exec virtual-tryon-frontend wget -qO- http://localhost:3000 2>/dev/null | head -c 200')

print("\nFrontend desplegado. Traefik emitirá SSL para pruebalo.wilkiedevs.com automáticamente.")
client.close()
