"""Ver variables de entorno del backend en el VPS relacionadas con n8n"""
import paramiko

host = '31.220.18.39'
user = 'root'
pwd  = 'Travis18456916#'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=pwd, timeout=30)

def run(cmd):
    _, stdout, _ = client.exec_command(cmd, timeout=15)
    return stdout.read().decode()

# Ver .env del backend
print('=== .env del backend ===')
env = run('cat /root/virtual-tryon/backend/.env')
# Filtrar solo líneas relevantes (ocultar secrets completos)
for line in env.splitlines():
    if any(k in line for k in ['N8N', 'WEBHOOK', 'BEARER', 'MINIO', 'SUPABASE_URL', 'CORS']):
        # Mostrar clave pero truncar valor si es muy largo
        if '=' in line:
            key, _, val = line.partition('=')
            safe_val = val[:60] + '...' if len(val) > 60 else val
            print(f'  {key}={safe_val}')

# También verificar variables de entorno activas del contenedor
print('\n=== Variables N8N en el contenedor ===')
n8n_vars = run("docker exec virtual-tryon-backend env | grep -i n8n")
print(n8n_vars or '(ninguna encontrada)')

client.close()
