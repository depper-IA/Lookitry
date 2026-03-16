import paramiko
import time

HOST = '31.220.18.39'
USER = 'root'
PASS = 'Travis18456916#'

def run(ssh, cmd, timeout=120):
    print(f'\n$ {cmd}')
    _, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode()
    err = stderr.read().decode()
    if out: print(out)
    if err: print('[stderr]', err)
    return out

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASS, timeout=15)
print('Conectado al VPS')

# 1. Pull del código
run(ssh, 'cd /root/virtual-tryon && git pull origin main')

# 2. Rebuild y restart backend
run(ssh, 'cd /root/virtual-tryon && docker compose -f docker-compose.backend.yml build --no-cache virtual-tryon-backend', timeout=300)
run(ssh, 'cd /root/virtual-tryon && docker compose -f docker-compose.backend.yml up -d virtual-tryon-backend')
time.sleep(5)

# 3. Rebuild y restart frontend
run(ssh, 'cd /root/virtual-tryon && docker compose -f docker-compose.frontend.yml build --no-cache virtual-tryon-frontend', timeout=300)
run(ssh, 'cd /root/virtual-tryon && docker compose -f docker-compose.frontend.yml up -d virtual-tryon-frontend')
time.sleep(8)

# 4. Verificar estado
run(ssh, 'docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"')

# 5. Verificar logs del backend
run(ssh, 'docker logs virtual-tryon-backend --tail 20')

# 6. Health check
run(ssh, 'curl -s https://api.pruebalo.wilkiedevs.com/health | head -c 200')

ssh.close()
print('\nDeploy completado.')
