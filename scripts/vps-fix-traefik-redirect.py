import paramiko, time

HOST = '31.220.18.39'
PORT = 22
USER = 'root'
PASS = 'Travis18456916#'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, port=PORT, username=USER, password=PASS, timeout=15)

def run(cmd, timeout=60):
    _, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    return out + ('\n[STDERR]: ' + err if err else '')

# ============================================================
# PROBLEMA RAÍZ:
# Traefik tiene redirección HTTP→HTTPS GLOBAL:
#   --entrypoints.web.http.redirections.entrypoint.to=websecure
# Esto hace que el httpChallenge de ACME falle porque
# Let's Encrypt llega por HTTP al /.well-known/acme-challenge/
# pero Traefik lo redirige a HTTPS → 404.
#
# SOLUCIÓN:
# 1. Quitar la redirección global del entrypoint web
# 2. Agregar un middleware de redirección HTTP→HTTPS
# 3. Aplicar ese middleware a cada router que lo necesite
#    (n8n, minio, api, frontend) EXCEPTO el challenge de ACME
#    (Traefik maneja el challenge automáticamente si no hay redirect global)
# ============================================================

print("=== Backup del docker-compose.yml ===")
print(run('cp /root/docker-compose.yml /root/docker-compose.yml.bak.$(date +%Y%m%d_%H%M%S)'))
print(run('ls /root/docker-compose.yml.bak.* | tail -3'))

# Nuevo docker-compose.yml con redirección por middleware en lugar de global
new_compose = '''services:
  traefik:
    image: traefik
    command:
      - --api.insecure=true
      - --providers.docker=true
      - --providers.docker.exposedbydefault=false
      - --entrypoints.web.address=:80
      - --entrypoints.websecure.address=:443
      - --certificatesresolvers.mytlschallenge.acme.httpchallenge=true
      - --certificatesresolvers.mytlschallenge.acme.httpchallenge.entrypoint=web
      - --certificatesresolvers.mytlschallenge.acme.email=${SSL_EMAIL}
      - --certificatesresolvers.mytlschallenge.acme.storage=/letsencrypt/acme.json
    restart: always
    ports:
      - 80:80
      - 443:443
      - 8080:8080
    volumes:
      - traefik_data:/letsencrypt
      - /var/run/docker.sock:/var/run/docker.sock:ro
    networks:
      - proxy
    labels:
      - "traefik.enable=true"
      - "traefik.http.middlewares.redirect-to-https.redirectscheme.scheme=https"
      - "traefik.http.middlewares.redirect-to-https.redirectscheme.permanent=true"
      - "traefik.http.routers.http-catchall.rule=HostRegexp(`{host:.+}`)"
      - "traefik.http.routers.http-catchall.entrypoints=web"
      - "traefik.http.routers.http-catchall.middlewares=redirect-to-https"
      - "traefik.http.routers.http-catchall.priority=1"
  n8n:
    image: docker.n8n.io/n8nio/n8n:latest
    labels:
      - traefik.enable=true
      - traefik.http.routers.n8n.rule=Host(`${SUBDOMAIN}.${DOMAIN_NAME}`)
      - traefik.http.routers.n8n.entrypoints=websecure
      - traefik.http.routers.n8n.tls=true
      - traefik.http.routers.n8n.tls.certresolver=mytlschallenge
      - traefik.http.middlewares.secure-headers.headers.browserXssFilter=true
      - traefik.http.middlewares.secure-headers.headers.contentTypeNosniff=true
      - traefik.http.middlewares.secure-headers.headers.stsSeconds=315360000
      - traefik.http.middlewares.secure-headers.headers.stsIncludeSubdomains=true
      - traefik.http.middlewares.secure-headers.headers.stsPreload=true
      - traefik.http.routers.n8n.middlewares=secure-headers@docker
      - traefik.http.services.n8n.loadbalancer.server.port=5678
      - traefik.docker.network=proxy
    environment:
      - N8N_HOST=${SUBDOMAIN}.${DOMAIN_NAME}
      - N8N_PORT=5678
      - N8N_PROTOCOL=https
      - NODE_ENV=production
      - WEBHOOK_URL=https://${SUBDOMAIN}.${DOMAIN_NAME}/
      - GENERIC_TIMEZONE=${GENERIC_TIMEZONE}
      - DB_TYPE=sqlite
      - N8N_REDIS_HOST=redis
      - N8N_REDIS_PORT=6379
      - GENERIC_TIMEZONE=America/Bogota
      - NODE_FUNCTION_ALLOW_EXTERNAL=axios,cheerio
      - NODE_FUNCTION_ALLOW_BUILTIN=crypto
      - N8N_EXEC_COMMAND_ALLOW_LIST=convert,magick
      - N8N_ALLOW_CORS=https://wilkiedevs.com,https://lwlanguageschool.com,https://*.wilkiedevs.com,https://*.lwlanguageschool.com
    restart: always
    volumes:
      - n8n_data:/home/node/.n8n
      - /local-files:/files
    networks:
      - proxy
  redis:
    image: redis:7
    restart: always
    networks:
      - proxy
  minio:
    image: minio/minio:latest
    container_name: minio
    command: server /data --console-address ":9001"
    environment:
      - MINIO_ROOT_USER=Wilkiedevs
      - MINIO_ROOT_PASSWORD=Travis2305*
      - MINIO_SERVER_URL=https://${MINIO_SUBDOMAIN}.${DOMAIN_NAME}
    labels:
      - traefik.enable=true
      - traefik.docker.network=proxy
      - traefik.http.routers.minio-api.rule=Host(`${MINIO_SUBDOMAIN}.${DOMAIN_NAME}`)
      - traefik.http.routers.minio-api.entrypoints=websecure
      - traefik.http.routers.minio-api.tls=true
      - traefik.http.routers.minio-api.tls.certresolver=mytlschallenge
      - traefik.http.services.minio-api.loadbalancer.server.port=9000
      - traefik.http.routers.minio-api.service=minio-api
      - traefik.http.routers.minio-console.rule=Host(`console.${MINIO_SUBDOMAIN}.${DOMAIN_NAME}`)
      - traefik.http.routers.minio-console.entrypoints=websecure
      - traefik.http.routers.minio-console.tls=true
      - traefik.http.routers.minio-console.tls.certresolver=mytlschallenge
      - traefik.http.services.minio-console.loadbalancer.server.port=9001
      - traefik.http.routers.minio-console.service=minio-console
    restart: unless-stopped
    volumes:
      - minio_data:/data
    networks:
      - proxy
  image-converter:
    build: ./image-converter
    container_name: image-converter
    restart: unless-stopped
    networks:
      - proxy
networks:
  proxy:
    external: true
volumes:
  traefik_data:
    external: true
  n8n_data:
    external: true
  minio_data:
    external: true
'''

print("\n=== Escribiendo nuevo docker-compose.yml ===")
# Escapar comillas para el heredoc
escaped = new_compose.replace("'", "'\\''")
write_cmd = f"cat > /root/docker-compose.yml << 'HEREDOC'\n{new_compose}\nHEREDOC"
_, stdout, stderr = client.exec_command(write_cmd, timeout=15)
stdout.read()
err = stderr.read().decode().strip()
if err:
    print(f"[STDERR]: {err}")
else:
    print("OK")

# Verificar que se escribió correctamente
print("\n=== Verificando cambio (líneas 8-12) ===")
print(run('sed -n "8,15p" /root/docker-compose.yml'))

# Reiniciar SOLO Traefik (no tocar n8n ni otros)
print("\n=== Reiniciando Traefik ===")
print(run('cd /root && docker compose up -d --no-deps traefik 2>&1', timeout=30))

time.sleep(8)

print("\n=== Estado de Traefik ===")
print(run('docker ps --filter name=traefik --format "{{.Names}} {{.Status}}"'))

print("\n=== n8n sigue OK ===")
print(run('docker ps --filter name=n8n --format "{{.Names}} {{.Status}}"'))

# Esperar a que Traefik intente el challenge
print("\n=== Esperando 20s para que Traefik intente el challenge... ===")
time.sleep(20)

print("\n=== Logs Traefik (challenge ACME) ===")
print(run('docker logs root-traefik-1 --since 30s 2>&1 | grep -iE "pruebalo|acme|cert|obtained|error|challenge|success|obtain" | head -15'))

# Verificar si obtuvo el cert
acme_path = run('docker volume inspect traefik_data --format "{{.Mountpoint}}"')
print("\n=== Dominios en acme.json ===")
print(run(f'cat {acme_path}/acme.json 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); certs=d.get(\'mytlschallenge\',{{}}).get(\'Certificates\',[]) or []; print(\'Total certs:\', len(certs)); [print(c.get(\'domain\',{{}}).get(\'main\',\'?\')) for c in certs]" 2>/dev/null || echo "vacio"'))

client.close()
print("\n=== DONE ===")
