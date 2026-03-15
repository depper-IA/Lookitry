import paramiko
import time

HOST = '31.220.18.39'
PORT = 22
USER = 'root'
PASS = 'Travis18456916#'
NVM = 'export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh" && '

def run(client, cmd, timeout=180):
    print(f"\n>>> {cmd[:120]}")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode()
    err = stderr.read().decode()
    if out.strip():
        print(out.strip())
    if err.strip():
        # Filtrar warnings normales de npm
        err_lines = [l for l in err.splitlines() if not any(w in l.lower() for w in ['warn', 'notice', 'deprecated'])]
        if err_lines:
            print("ERR:", '\n'.join(err_lines[:20]))
    return out, err

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, port=PORT, username=USER, password=PASS, timeout=15)
print("Conectado al VPS")

# 1. Pull del repo
run(client, 'cd /root/virtual-tryon && git pull origin main')

# 2. Escribir .env del backend en el VPS
backend_env = """PORT=3001
NODE_ENV=production
SUPABASE_URL=https://vkdooutklowctuudjnkl.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrZG9vdXRrbG93Y3R1dWRqbmtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3NjU2NjUsImV4cCI6MjA4NjM0MTY2NX0.ysvYQtcl2hCEOJVczXG-4knzt6oOd74z9iE3Ci_KOWM
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrZG9vdXRrbG93Y3R1dWRqbmtsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDc2NTY2NSwiZXhwIjoyMDg2MzQxNjY1fQ.NxXV0Too3Iadb0FGuC8powPUuaMPiF1TKIUVtGMyFpg
JWT_SECRET=virtual-tryon-saas-secret-key-change-in-production-2026
JWT_EXPIRES_IN=7d
N8N_WEBHOOK_URL=https://n8n.wilkiedevs.com/webhook/tryon
N8N_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NGUxZTYyYi1kY2M0LTRiZGUtOWFjZS02OTBmMjAxMGIyMDAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiZWE2NmI1N2ItNTBiNS00ZTViLWJhYzYtZDE2MWFkM2NkZTkzIiwiaWF0IjoxNzczMjc5MzMyfQ.ZuYsz4K4ifpp9ho_nZzpDypTy49_APNx9hkecKridJw
N8N_TIMEOUT=90000
N8N_BEARER_TOKEN=Travis2305**
N8N_HEADER_NAME=Authorization
OPENROUTER_API_KEY=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
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=info@pruebalo.wilkiedevs.com
SMTP_PASS=Travis2305*
SMTP_FROM=Virtual Try-On SaaS <info@pruebalo.wilkiedevs.com>
FRONTEND_URL=https://pruebalo.wilkiedevs.com
CORS_ORIGIN=https://pruebalo.wilkiedevs.com
WOMPI_PUBLIC_KEY=pub_test_3X84dh5ArV79atO6WwNFznjK3kv45JI2
WOMPI_PRIVATE_KEY=prv_test_ZrBx84WuuB6V7NDPf7Ed9XyRYhg77J1s
WOMPI_EVENTS_SECRET=test_events_ywYgTECX1VdqCmLiGPxeUYXzaJqIAVsg
WOMPI_INTEGRITY_SECRET=test_integrity_9tTBgHdvYU2yPEIapYGbeFvNCqrlfLQG
WOMPI_ENABLED=true
"""

# Escribir .env usando printf para evitar problemas con heredoc
env_lines = backend_env.strip().split('\n')
write_cmd = 'printf "" > /root/virtual-tryon/backend/.env'
run(client, write_cmd)
for line in env_lines:
    # Escapar caracteres especiales para printf
    escaped = line.replace('\\', '\\\\').replace('%', '%%').replace("'", "'\\''")
    run(client, f"echo '{escaped}' >> /root/virtual-tryon/backend/.env")

print("\n.env escrito correctamente")
run(client, 'wc -l /root/virtual-tryon/backend/.env')

# 3. Instalar TODAS las dependencias (incluyendo devDeps para el build de TypeScript)
print("\n--- Instalando dependencias (incluyendo devDeps para build) ---")
run(client, NVM + 'cd /root/virtual-tryon/backend && npm install', timeout=180)

# 4. Build de TypeScript
print("\n--- Compilando TypeScript ---")
out, err = run(client, NVM + 'cd /root/virtual-tryon/backend && npm run build', timeout=120)

if 'error TS' in out or 'error TS' in err:
    print("\nERROR: El build de TypeScript falló. Revisa los errores arriba.")
    client.close()
    exit(1)

print("\nBuild exitoso")

# 5. Reiniciar PM2 con el nuevo build
print("\n--- Reiniciando PM2 ---")
run(client, NVM + 'pm2 delete virtual-tryon-backend 2>/dev/null || true')
run(client, NVM + 'pm2 start /root/virtual-tryon/backend/dist/index.js --name virtual-tryon-backend')
run(client, NVM + 'pm2 save')
run(client, NVM + 'pm2 status')

# 6. Esperar y verificar que el backend responde
print("\n--- Verificando backend ---")
time.sleep(4)
run(client, 'curl -s http://localhost:3001/health | head -c 300')

# 7. Configurar Nginx si no está configurado
print("\n--- Configurando Nginx ---")
nginx_conf = """server {
    listen 80;
    server_name api.pruebalo.wilkiedevs.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 90s;
    }
}"""

run(client, f"cat > /etc/nginx/sites-available/virtual-tryon-api << 'NGINXEOF'\n{nginx_conf}\nNGINXEOF")
run(client, 'ln -sf /etc/nginx/sites-available/virtual-tryon-api /etc/nginx/sites-enabled/virtual-tryon-api')
run(client, 'nginx -t')
run(client, 'systemctl reload nginx')

print("\nNginx configurado para api.pruebalo.wilkiedevs.com -> localhost:3001")
print("\nDeploy del backend completado.")
client.close()
