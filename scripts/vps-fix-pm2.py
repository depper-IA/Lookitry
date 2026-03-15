import paramiko
import time

HOST = '31.220.18.39'
PORT = 22
USER = 'root'
PASS = 'Travis18456916#'
NVM = 'export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh" && '

def run(client, cmd, timeout=60):
    print(f"\n>>> {cmd[:120]}")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode()
    err = stderr.read().decode()
    if out.strip():
        print(out.strip())
    if err.strip():
        err_lines = [l for l in err.splitlines() if not any(w in l.lower() for w in ['warn', 'notice', 'deprecated'])]
        if err_lines:
            print("ERR:", '\n'.join(err_lines[:10]))
    return out, err

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, port=PORT, username=USER, password=PASS, timeout=15)
print("Conectado al VPS")

# Verificar que el .env existe y tiene contenido
print("\n--- Verificando .env ---")
run(client, 'cat /root/virtual-tryon/backend/.env')

# Verificar que el dist existe
print("\n--- Verificando dist ---")
run(client, 'ls /root/virtual-tryon/backend/dist/')

# Matar todos los procesos PM2 anteriores
print("\n--- Limpiando PM2 ---")
run(client, NVM + 'pm2 kill')
time.sleep(2)

# Iniciar con --env-file explícito y desde el directorio correcto
print("\n--- Iniciando backend con PM2 (con env-file) ---")
run(client, NVM + 'cd /root/virtual-tryon/backend && pm2 start dist/index.js --name virtual-tryon-backend --env-file /root/virtual-tryon/backend/.env')
time.sleep(3)

run(client, NVM + 'pm2 status')
run(client, NVM + 'pm2 logs virtual-tryon-backend --lines 20 --nostream')

# Verificar health
print("\n--- Health check ---")
time.sleep(3)
run(client, 'curl -s http://localhost:3001/health')

# Guardar configuración PM2
run(client, NVM + 'pm2 save')

# Verificar qué servidor web hay instalado
print("\n--- Detectando servidor web ---")
run(client, 'which caddy 2>/dev/null || which nginx 2>/dev/null || which apache2 2>/dev/null || echo "ninguno encontrado"')
run(client, 'systemctl list-units --type=service --state=running | grep -E "caddy|nginx|apache|traefik"')
run(client, 'docker ps 2>/dev/null | head -20')

client.close()
