import paramiko
import time

HOST = '31.220.18.39'
PORT = 22
USER = 'root'
PASS = 'Travis18456916#'
NVM = 'export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh" && '

def run(client, cmd, timeout=300):
    print(f"\n>>> {cmd[:120]}")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode()
    err = stderr.read().decode()
    if out.strip():
        print(out.strip()[:500])
    if err.strip():
        err_lines = [l for l in err.splitlines() if not any(w in l.lower() for w in ['warn', 'notice', 'deprecated', 'info'])]
        if err_lines:
            print("ERR:", '\n'.join(err_lines[:20]))
    return out, err

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, port=PORT, username=USER, password=PASS, timeout=15)
print("Conectado al VPS")

# 1. Pull del repo
run(client, 'cd /root/virtual-tryon && git pull origin main')

# 2. Escribir .env de producción del frontend
frontend_env = """NEXT_PUBLIC_API_URL=https://api.pruebalo.wilkiedevs.com
NEXT_PUBLIC_APP_URL=https://pruebalo.wilkiedevs.com
NEXT_PUBLIC_SUPABASE_URL=https://vkdooutklowctuudjnkl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrZG9vdXRrbG93Y3R1dWRqbmtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3NjU2NjUsImV4cCI6MjA4NjM0MTY2NX0.ysvYQtcl2hCEOJVczXG-4knzt6oOd74z9iE3Ci_KOWM
NEXT_PUBLIC_N8N_DESCRIPTOR_URL=https://n8n.wilkiedevs.com/webhook/descriptor
"""

env_lines = frontend_env.strip().split('\n')
run(client, 'printf "" > /root/virtual-tryon/frontend/.env.production')
for line in env_lines:
    escaped = line.replace('\\', '\\\\').replace("'", "'\\''")
    run(client, f"echo '{escaped}' >> /root/virtual-tryon/frontend/.env.production")

print("\n.env.production del frontend escrito")

# 3. Instalar dependencias
print("\n--- Instalando dependencias del frontend ---")
run(client, NVM + 'cd /root/virtual-tryon/frontend && npm install', timeout=180)

# 4. Build de Next.js (puede tardar varios minutos)
print("\n--- Compilando Next.js (puede tardar 3-5 minutos) ---")
out, err = run(client, NVM + 'cd /root/virtual-tryon/frontend && npm run build', timeout=600)

if 'Build error' in out or 'Build error' in err or 'Failed to compile' in out:
    print("\nERROR: El build de Next.js falló.")
    client.close()
    exit(1)

print("\nBuild de Next.js exitoso")

# 5. Iniciar frontend con PM2
print("\n--- Iniciando frontend con PM2 ---")
run(client, NVM + 'pm2 delete virtual-tryon-frontend 2>/dev/null || true')
run(client, NVM + 'cd /root/virtual-tryon/frontend && pm2 start npm --name virtual-tryon-frontend -- start')
run(client, NVM + 'pm2 save')
run(client, NVM + 'pm2 status')

# 6. Configurar Nginx para el frontend
print("\n--- Configurando Nginx para el frontend ---")
nginx_frontend = """server {
    listen 80;
    server_name pruebalo.wilkiedevs.com www.pruebalo.wilkiedevs.com;

    location / {
        proxy_pass http://localhost:3000;
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

run(client, f"cat > /etc/nginx/sites-available/virtual-tryon-frontend << 'NGINXEOF'\n{nginx_frontend}\nNGINXEOF")
run(client, 'ln -sf /etc/nginx/sites-available/virtual-tryon-frontend /etc/nginx/sites-enabled/virtual-tryon-frontend')
run(client, 'nginx -t')
run(client, 'systemctl reload nginx')

# 7. Verificar
print("\n--- Verificando frontend ---")
time.sleep(4)
run(client, 'curl -s -o /dev/null -w "%{http_code}" http://localhost:3000')

print("\nDeploy del frontend completado.")
print("Frontend: http://pruebalo.wilkiedevs.com (pendiente DNS y SSL)")
client.close()
