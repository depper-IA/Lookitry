import paramiko
import time

HOST = '31.220.18.39'
USER = 'root'
PASS = 'Travis18456916#'

def run(ssh, cmd, timeout=300):
    print(f'\n$ {cmd}')
    _, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode()
    err = stderr.read().decode()
    if out: print(out[-3000:])  # últimas 3000 chars
    if err and 'stderr' not in err.lower()[:10]:
        print('[stderr]', err[-1000:])
    return out

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASS, timeout=15)
print('Conectado al VPS')

# Rebuild backend (servicio se llama "backend")
print('\n=== Rebuild backend ===')
run(ssh, 'cd /root/virtual-tryon && docker compose -f docker-compose.backend.yml build --no-cache backend', timeout=300)
run(ssh, 'cd /root/virtual-tryon && docker compose -f docker-compose.backend.yml up -d backend')
time.sleep(6)

# Rebuild frontend (servicio se llama "frontend")
print('\n=== Rebuild frontend ===')
run(ssh, 'cd /root/virtual-tryon && docker compose -f docker-compose.frontend.yml build --no-cache frontend', timeout=300)
run(ssh, 'cd /root/virtual-tryon && docker compose -f docker-compose.frontend.yml up -d frontend')
time.sleep(10)

# Estado final
print('\n=== Estado contenedores ===')
run(ssh, 'docker ps --format "table {{.Names}}\t{{.Status}}"', timeout=15)

print('\n=== Logs backend (últimas 15 líneas) ===')
run(ssh, 'docker logs virtual-tryon-backend --tail 15', timeout=15)

print('\n=== Health check ===')
run(ssh, 'curl -s https://api.pruebalo.wilkiedevs.com/health', timeout=15)

print('\n=== Verificar nuevo endpoint verify-email ===')
run(ssh, 'curl -s "https://api.pruebalo.wilkiedevs.com/api/auth/verify-email?token=test123"', timeout=15)

print('\n=== Verificar endpoint trial/status ===')
run(ssh, 'curl -s https://api.pruebalo.wilkiedevs.com/api/trial/status', timeout=15)

ssh.close()
print('\nDeploy completado.')
