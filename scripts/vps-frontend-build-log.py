import paramiko

HOST = '31.220.18.39'
PORT = 22
USER = 'root'
PASS = 'Travis18456916#'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, port=PORT, username=USER, password=PASS, timeout=15)

# Build con output completo para ver todos los errores
_, stdout, stderr = client.exec_command(
    'cd /root/virtual-tryon/frontend && '
    'export NEXT_PUBLIC_API_URL=https://api.pruebalo.wilkiedevs.com && '
    'export NEXT_PUBLIC_APP_URL=https://pruebalo.wilkiedevs.com && '
    'export NEXT_PUBLIC_SUPABASE_URL=https://vkdooutklowctuudjnkl.supabase.co && '
    'export NEXT_PUBLIC_SUPABASE_ANON_KEY=test && '
    'export NEXT_PUBLIC_N8N_DESCRIPTOR_URL=https://n8n.wilkiedevs.com/webhook/descriptor && '
    'export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh" && '
    'npm run build 2>&1',
    timeout=300
)
out = stdout.read().decode()
err = stderr.read().decode()
combined = out + err

# Mostrar solo las líneas de error
lines = combined.split('\n')
error_lines = [l for l in lines if any(x in l for x in ['error', 'Error', 'Type error', 'Failed', '×', '✗'])]
print('\n'.join(error_lines[:50]))
print('\n--- ULTIMAS 30 LINEAS ---')
print('\n'.join(lines[-30:]))
client.close()
