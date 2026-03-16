import paramiko, time, json

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
# DIAGNÓSTICO FINAL:
# El puerto 80 de Hostinger tiene un proxy/LiteSpeed delante
# que intercepta las peticiones HTTP antes de que lleguen a Traefik.
# Por eso el httpChallenge siempre falla con 404 (LiteSpeed responde).
#
# SOLUCIÓN: Cambiar a tlsChallenge (puerto 443, ALPN TLS)
# El puerto 443 SÍ llega directamente al VPS (Traefik lo maneja).
# Esto es lo que usaban los otros dominios (n8n, minio, api) exitosamente.
#
# PASOS:
# 1. Cambiar docker-compose.yml: httpchallenge → tlschallenge
# 2. Limpiar el cert de pruebalo.wilkiedevs.com del acme.json
#    (para forzar que Traefik lo obtenga de nuevo)
# 3. Reiniciar Traefik
# ============================================================

print("=== Paso 1: Leer acme.json y remover cert de pruebalo ===")
acme_path = run('docker volume inspect traefik_data --format "{{.Mountpoint}}"')
acme_file = f"{acme_path}/acme.json"
print(f"Ruta acme.json: {acme_file}")

# Leer acme.json actual
acme_content = run(f'cat {acme_file}')
try:
    acme_data = json.loads(acme_content)
    certs = acme_data.get('mytlschallenge', {}).get('Certificates', []) or []
    print(f"Certs actuales: {[c.get('domain', {}).get('main', '?') for c in certs]}")
    
    # Filtrar: quitar pruebalo.wilkiedevs.com
    new_certs = [c for c in certs if 'pruebalo.wilkiedevs.com' not in str(c.get('domain', {}))]
    acme_data['mytlschallenge']['Certificates'] = new_certs
    print(f"Certs después de limpiar: {[c.get('domain', {}).get('main', '?') for c in new_certs]}")
    
    # Escribir acme.json limpio
    new_acme = json.dumps(acme_data)
    # Escapar para bash
    new_acme_escaped = new_acme.replace("'", "'\\''")
    write_result = run(f"echo '{new_acme_escaped}' > {acme_file} && chmod 600 {acme_file}")
    print(f"Escritura acme.json: {write_result or 'OK'}")
except Exception as e:
    print(f"Error procesando acme.json: {e}")

print("\n=== Paso 2: Actualizar docker-compose.yml (httpchallenge → tlschallenge) ===")
# Backup
print(run('cp /root/docker-compose.yml /root/docker-compose.yml.bak2'))

new_compose = '''services:
  traefik:
    image: traefik
    command:
      - --api.insecure=true
      - --providers.docker=true
      - --providers.docker.exposedbydefault=false
      - --entrypoints.web.address=:80
      - --entrypoints.websecure.address=:443
      - --certificatesresolvers.mytlschallenge.acme.tlschallenge=true
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

write_cmd = f"cat > /root/docker-compose.yml << 'HEREDOC'\n{new_compose}\nHEREDOC"
_, stdout, stderr = client.exec_command(write_cmd, timeout=15)
stdout.read()
err = stderr.read().decode().strip()
print(f"Escritura compose: {err or 'OK'}")

# Verificar cambio
print("\n=== Verificar tlschallenge en compose ===")
print(run('grep -n "tlschallenge\|httpchallenge" /root/docker-compose.yml'))

print("\n=== Paso 3: Reiniciar Traefik ===")
print(run('cd /root && docker compose up -d --no-deps traefik 2>&1', timeout=30))

time.sleep(10)

print("\n=== Estado contenedores ===")
print(run('docker ps --format "{{.Names}} {{.Status}}" | grep -E "traefik|n8n|frontend|backend"'))

print("\n=== Esperando 25s para que Traefik obtenga el cert... ===")
time.sleep(25)

print("\n=== Logs Traefik (ACME) ===")
print(run('docker logs root-traefik-1 --since 40s 2>&1 | grep -iE "pruebalo|acme|cert|obtained|error|tls|success|obtain" | head -15'))

# Verificar acme.json
print("\n=== Dominios en acme.json ===")
print(run(f'cat {acme_file} 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); certs=d.get(\'mytlschallenge\',{{}}).get(\'Certificates\',[]) or []; print(\'Total:\', len(certs)); [print(c.get(\'domain\',{{}}).get(\'main\',\'?\')) for c in certs]" 2>/dev/null || echo "error"'))

# Test SSL final
print("\n=== Test SSL pruebalo.wilkiedevs.com ===")
print(run('echo | openssl s_client -connect pruebalo.wilkiedevs.com:443 -servername pruebalo.wilkiedevs.com 2>/dev/null | openssl x509 -noout -dates -issuer 2>/dev/null || echo "NO CERT AUN"'))

print("\n=== n8n sigue OK ===")
print(run('docker ps --filter name=n8n --format "{{.Names}} {{.Status}}"'))
print(run('curl -s --max-time 5 -o /dev/null -w "%{http_code}" https://n8n.wilkiedevs.com/ 2>/dev/null || echo "no responde"'))

client.close()
print("\n=== DONE ===")
