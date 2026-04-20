import paramiko
import sys
import io

# Read the docker-compose content
with open(r'C:\Users\Matt\Lookitry\scripts\n8n-docker-compose.yml', 'r') as f:
    compose_content = f.read()

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect('31.220.18.39', username='root', password='Travis18456916#', timeout=20)
    sftp = client.open_sftp()

    # 1. Create backup of current n8n volume info
    stdin, stdout, stderr = client.exec_command('docker volume ls --format "{{.Name}}" | grep n8n')
    print('=== n8n volumes ===')
    print(stdout.read().decode())

    # 2. Upload the new docker-compose file
    remote_path = '/root/n8n-docker-compose.yml'
    sftp.putfo(io.StringIO(compose_content), remote_path)
    print(f'\n=== Subido docker-compose a {remote_path} ===')

    # 3. Stop n8n container
    print('\n=== Deteniendo n8n... ===')
    stdin, stdout, stderr = client.exec_command('docker stop root-n8n-1')
    print(stdout.read().decode())
    print(stderr.read().decode())

    # 4. Remove old container (keep volume)
    print('\n=== Eliminando contenedor (manteniendo volumen)... ===')
    stdin, stdout, stderr = client.exec_command('docker rm root-n8n-1')
    print(stdout.read().decode())
    print(stderr.read().decode())

    # 5. Start n8n with new docker-compose
    print('\n=== Iniciando n8n con nuevas variables... ===')
    stdin, stdout, stderr = client.exec_command('cd /root && docker compose -f n8n-docker-compose.yml up -d')
    print(stdout.read().decode())
    print(stderr.read().decode())

    # 6. Wait a bit for n8n to start
    import time
    print('\nEsperando 15s para que n8n inicie...')
    time.sleep(15)

    # 7. Verify new environment variables
    print('\n=== Verificando nuevas variables de entorno ===')
    stdin, stdout, stderr = client.exec_command('docker exec root-n8n-1 env | grep -E "N8N|WEBHOOK|HOST|PROTOCOL" | sort')
    env_output = stdout.read().decode()
    print(env_output)

    if 'WEBHOOK_URL' in env_output:
        print('\n✅ WEBHOOK_URL configurado correctamente!')
    else:
        print('\n⚠️  WEBHOOK_URL no aparece - revisando...')
        stdin, stdout, stderr = client.exec_command('docker exec root-n8n-1 env')
        print(stdout.read().decode())

    # 8. Check container status
    print('\n=== Estado del contenedor ===')
    stdin, stdout, stderr = client.exec_command('docker ps --filter "name=n8n" --format "{{.Names}} {{.Status}}"')
    print(stdout.read().decode())

    # 9. Check if n8n is responding
    print('\n=== Test de conectividad ===')
    stdin, stdout, stderr = client.exec_command('curl -s -o /dev/null -w "%{http_code}" http://localhost:5678/ 2>/dev/null || echo "curl failed"')
    print(f'n8n HTTP status: {stdout.read().decode()}')

    sftp.close()
    client.close()
    print('\n✅ Proceso completado')

except Exception as e:
    print(f'ERROR: {e}', file=sys.stderr)
    import traceback
    traceback.print_exc()
