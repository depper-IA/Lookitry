import paramiko
import sys

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect('31.220.18.39', username='root', password='Travis18456916#', timeout=20)

    # 1. Check container is running
    print('=== ESTADO DE CONTENEDORES ===')
    stdin, stdout, stderr = client.exec_command('docker ps --filter "name=n8n" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"')
    print(stdout.read().decode())

    # 2. Verify n8n webhooks via API - get workflow details
    print('\n=== VERIFICANDO n8n API ===')
    # First, get n8n version to confirm it's responding
    stdin, stdout, stderr = client.exec_command('curl -s http://localhost:5678/rest/sys_key 2>/dev/null || echo "API check..."')
    print(stdout.read().decode())

    # 3. Check if n8n is accessible via Traefik/public URL
    print('\n=== TEST VIA TRAEFIK (n8n.wilkiedevs.com) ===')
    stdin, stdout, stderr = client.exec_command('curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" --connect-timeout 10 https://n8n.wilkiedevs.com 2>/dev/null || echo "Traefik test..."')
    print(stdout.read().decode())

    # 4. Check n8n logs for webhook URL registration
    print('\n=== ULTIMOS LOGS DE N8N (20 lineas) ===')
    stdin, stdout, stderr = client.exec_command('docker logs root-n8n-1 --tail 30 2>&1 | grep -i "webhook\|url\|host\|started\|version" | tail -20')
    print(stdout.read().decode())

    # 5. Full env to confirm all vars
    print('\n=== TODAS LAS VARIABLES DE N8N ===')
    stdin, stdout, stderr = client.exec_command('docker exec root-n8n-1 env | sort')
    print(stdout.read().decode())

    # 6. Network connectivity
    print('\n=== REDES DEL CONTENEDOR ===')
    stdin, stdout, stderr = client.exec_command('docker inspect root-n8n-1 --format "{{json .NetworkSettings.Networks}}" | python3 -m json.tool 2>/dev/null || docker inspect root-n8n-1 --format "{{range $k, $v := .NetworkSettings.Networks}}{{$k}} {{end}}"')
    networks = stdout.read().decode()
    print(networks)
    if 'proxy' in networks and 'n8n_network' in networks:
        print('\n[OK] n8n esta en redes proxy y n8n_network')
    else:
        print('\n[INFO] Redes del contenedor verificadas')

    client.close()
    print('\n=== VERIFICACION COMPLETADA ===')

except Exception as e:
    print(f'ERROR: {e}', file=sys.stderr)
    import traceback
    traceback.print_exc()
