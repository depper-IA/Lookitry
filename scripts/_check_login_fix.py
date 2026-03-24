import paramiko, os, time
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '../backend/.env'))

HOST = '31.220.18.39'
USER = 'root'
PASS = os.getenv('VPS_PASS')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASS, timeout=30)
print('Conectado al VPS\n')

# 1. Ver variables activas en el contenedor backend
print('=== Variables NODE_ENV y COOKIE_DOMAIN en el contenedor ===')
_, out, _ = ssh.exec_command('docker exec lookitry-backend env | grep -E "NODE_ENV|COOKIE_DOMAIN" 2>/dev/null || docker exec virtual-tryon-backend env | grep -E "NODE_ENV|COOKIE_DOMAIN" 2>/dev/null')
print(out.read().decode().strip() or 'No se pudo leer (contenedor no encontrado)')

# 2. Ver contenedores corriendo
print('\n=== Contenedores activos ===')
_, out, _ = ssh.exec_command('docker ps --format "table {{.Names}}\t{{.Status}}"')
print(out.read().decode().strip())

# 3. Ver qué .env.production tiene actualmente
print('\n=== NODE_ENV y COOKIE_DOMAIN en .env.production ===')
_, out, _ = ssh.exec_command('grep -E "NODE_ENV|COOKIE_DOMAIN" /root/virtual-tryon/backend/.env.production')
print(out.read().decode().strip())

ssh.close()
