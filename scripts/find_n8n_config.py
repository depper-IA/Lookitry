import paramiko
import sys

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect('31.220.18.39', username='root', password='Travis18456916#', timeout=20)
    
    # List all docker-compose files in /root
    stdin, stdout, stderr = client.exec_command('ls -la /root/')
    print('=== /root/ contents ===')
    print(stdout.read().decode())
    
    # Check virtual-tryon directory
    stdin2, stdout2, stderr2 = client.exec_command('ls -la /root/virtual-tryon/')
    print('\n=== /root/virtual-tryon/ ===')
    print(stdout2.read().decode())
    
    # Check if n8n has its own docker-compose
    stdin3, stdout3, stderr3 = client.exec_command('find / -name "docker-compose*n8n*" -o -name "*n8n*docker-compose*" 2>/dev/null | grep -v proc')
    print('\n=== n8n docker-compose files ===')
    print(stdout3.read().decode())
    
    # Check docker network proxy
    stdin4, stdout4, stderr4 = client.exec_command('docker network ls')
    print('\n=== Docker networks ===')
    print(stdout4.read().decode())
    
    # Check all containers
    stdin5, stdout5, stderr5 = client.exec_command('docker ps -a --format "table {{.Names}}\\t{{.Image}}\\t{{.Status}}\\t{{.Ports}}"')
    print('\n=== All containers ===')
    print(stdout5.read().decode())
    
    client.close()
except Exception as e:
    print(f'ERROR: {e}', file=sys.stderr)
    import traceback
    traceback.print_exc()
