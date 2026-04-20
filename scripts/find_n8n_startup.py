import paramiko
import sys

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect('31.220.18.39', username='root', password='Travis18456916#', timeout=20)

    # Check docker history for n8n to see how it was started
    stdin, stdout, stderr = client.exec_command('docker history docker.n8n.io/n8nio/n8n:latest 2>/dev/null | head -5')
    print('=== docker history ===')
    print(stdout.read().decode())

    # Check if there's a startup script
    stdin2, stdout2, stderr2 = client.exec_command('ls -la /root/scripts/ 2>/dev/null; cat /root/actualizar-n8n.log 2>/dev/null')
    print('\n=== scripts dir and n8n log ===')
    print(stdout2.read().decode())
    print(stderr2.read().decode())

    # Try to see n8n's actual webhook URL it thinks it has
    stdin3, stdout3, stderr3 = client.exec_command('docker exec root-n8n-1 wget -qO- http://localhost:5678/rest/sys_key 2>/dev/null || curl -s http://localhost:5678/rest/sys_key 2>/dev/null || echo "Cannot query n8n API directly"')
    print('\n=== n8n API test ===')
    print(stdout3.read().decode())
    print(stderr3.read().decode())

    # Check port 5678 is bound
    stdin4, stdout4, stderr4 = client.exec_command('docker port root-n8n-1')
    print('\n=== n8n ports ===')
    print(stdout4.read().decode())

    # Check traefik config for n8n
    stdin5, stdout5, stderr5 = client.exec_command('cat /root/traefik.yml')
    print('\n=== traefik.yml ===')
    print(stdout5.read().decode())

    client.close()
except Exception as e:
    print(f'ERROR: {e}', file=sys.stderr)
    import traceback
    traceback.print_exc()
