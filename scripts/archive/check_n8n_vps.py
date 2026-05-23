import paramiko
import sys

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect('31.220.18.39', username='root', password='Travis18456916#', timeout=20)
    
    # How is n8n running?
    stdin, stdout, stderr = client.exec_command('docker ps --filter "name=n8n" --format "{{.Names}} {{.Image}} {{.Status}}"')
    print('=== CONTENEDORES N8N ===')
    print(stdout.read().decode())
    
    # Find docker-compose files
    stdin2, stdout2, stderr2 = client.exec_command('find /root -name "docker-compose*.yml" -o -name "docker-compose*.yaml" 2>/dev/null | head -20')
    print('\n=== DOCKER-COMPOSE FILES ===')
    print(stdout2.read().decode())
    
    # Check docker inspect for n8n
    stdin3, stdout3, stderr3 = client.exec_command('docker inspect root-n8n-1 --format "{{json .Config.Env}}" | python3 -m json.tool 2>/dev/null || docker inspect root-n8n-1 --format "{{json .Config.Env}}"')
    print('\n=== N8N ENV (docker inspect) ===')
    print(stdout3.read().decode())
    
    # Check CMD/ENTRYPOINT
    stdin4, stdout4, stderr4 = client.exec_command('docker inspect root-n8n-1 --format "{{json .Config.Cmd}}"')
    print('\n=== N8N CMD ===')
    print(stdout4.read().decode())
    
    client.close()
except Exception as e:
    print(f'ERROR: {e}', file=sys.stderr)
    import traceback
    traceback.print_exc()
