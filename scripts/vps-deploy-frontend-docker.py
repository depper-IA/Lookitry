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
        print(out.strip()[:1000])
    if err.strip():
        err_lines = [l for l in err.splitlines() if not any(w in l.lower() for w in ['warn', 'notice', 'deprecated'])]
        if err_lines:
            print("ERR:", '\n'.join(err_lines[:20]))
    return out, err

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, port=PORT, username=USER, password=PASS, timeout=15)
print("Conectado al VPS")

# 1. Git pull PRIMERO para tener el codigo actualizado
print("\n--- Git pull ---")
run(client, 'cd /root/virtual-tryon && git pull origin main')

# Verificar que el archivo fue actualizado
print("\n--- Verificando wompi.service.ts actualizado ---")
run(client, 'grep -n "api.get" /root/virtual-tryon/frontend/src/services/wompi.service.ts')

# 2. Dockerfile
print("\n--- Creando Dockerfile ---")
dockerfile = """FROM node:20-alpine AS builder
WORKDIR /app

ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_N8N_DESCRIPTOR_URL

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_N8N_DESCRIPTOR_URL=$NEXT_PUBLIC_N8N_DESCRIPTOR_URL

COPY package*.json ./
RUN npm install
COPY . .
RUN npx next build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
"""
run(client, f"cat > /root/virtual-tryon/frontend/Dockerfile << 'DOCKEREOF'\n{dockerfile}\nDOCKEREOF")

# 3. docker-compose
compose = """services:
  frontend:
    build:
      context: /root/virtual-tryon/frontend
      dockerfile: Dockerfile
      args:
        NEXT_PUBLIC_API_URL: https://api.pruebalo.wilkiedevs.com
        NEXT_PUBLIC_APP_URL: https://pruebalo.wilkiedevs.com
        NEXT_PUBLIC_SUPABASE_URL: https://vkdooutklowctuudjnkl.supabase.co
        NEXT_PUBLIC_SUPABASE_ANON_KEY: ***REMOVED-SECRET***
        NEXT_PUBLIC_N8N_DESCRIPTOR_URL: https://n8n.wilkiedevs.com/webhook/descriptor
    container_name: virtual-tryon-frontend
    restart: unless-stopped
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

# 4. Build
print("\n--- Build del frontend (5-8 minutos) ---")
out, err = run(client, 'docker compose -f /root/virtual-tryon/docker-compose.frontend.yml build --no-cache 2>&1', timeout=600)

combined = out + err
if 'failed to solve' in combined.lower() or ('exit code: 1' in combined.lower()):
    print("\nBuild falló. Ultimas lineas:")
    print(combined[-2000:])
    client.close()
    exit(1)

print("\nBuild exitoso")

# 5. Levantar
print("\n--- Iniciando frontend ---")
run(client, 'docker compose -f /root/virtual-tryon/docker-compose.frontend.yml up -d')
time.sleep(8)

print("\n--- Estado ---")
run(client, 'docker ps | grep virtual-tryon')
run(client, 'docker logs virtual-tryon-frontend --tail 15')

print("\n--- Health check ---")
run(client, 'docker exec virtual-tryon-frontend wget -qO- http://localhost:3000 2>/dev/null | head -c 200')

print("\n--- Traefik ---")
run(client, 'docker logs root-traefik-1 --since 30s 2>&1 | tail -5')

print("\nURL: https://pruebalo.wilkiedevs.com")
client.close()
