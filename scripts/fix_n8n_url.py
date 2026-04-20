import paramiko
import sys

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect('31.220.18.39', username='root', password='Travis18456916#', timeout=20)
    
    # Check current n8n environment
    stdin, stdout, stderr = client.exec_command('docker exec root-n8n-1 env')
    env_lines = stdout.read().decode().split('\n')
    n8n_lines = [l for l in env_lines if 'N8N' in l or 'WEBHOOK' in l or 'HOST' in l or 'URL' in l]
    print('=== ENV ACTUAL DE N8N (N8N/HOST/WEBHOOK/URL) ===')
    for line in sorted(n8n_lines):
        print(line)
    
    # Check docker-compose on VPS
    stdin2, stdout2, stderr2 = client.exec_command('cat /root/vps-docker-compose.yml 2>/dev/null | grep -A 30 "n8n:"')
    print('\n=== docker-compose.yml n8n section ===')
    print(stdout2.read().decode())
    
    # Check if there's a settings file
    stdin3, stdout3, stderr3 = client.exec_command('docker exec root-n8n-1 n8n config 2>/dev/null || echo "n8n config not available"')
    print('\n=== n8n config ===')
    print(stdout3.read().decode())
    
    client.close()
    print('\nConexion exitosa')
except Exception as e:
    print(f'ERROR: {e}', file=sys.stderr)
    import traceback
    traceback.print_exc()
