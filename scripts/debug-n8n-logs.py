"""
Ver logs de n8n en tiempo real mientras se ejecuta el webhook.
Primero dispara el webhook, luego captura los logs.
"""
import paramiko, requests, threading, time, json

host = '31.220.18.39'
user = 'root'
pwd  = 'Travis18456916#'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=pwd, timeout=30)

def run(cmd, timeout=30):
    _, stdout, _ = client.exec_command(cmd, timeout=timeout)
    return stdout.read().decode()

# Capturar logs de n8n de los últimos 50 antes del test
print('=== Logs n8n ANTES del test ===')
logs_before = run('docker logs root-n8n-1 --tail 20 2>&1')
print(logs_before[-500:] if len(logs_before) > 500 else logs_before)

# Disparar el webhook
print('\n=== Disparando webhook ===')
PNG_B64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg=='

def call_webhook():
    try:
        r = requests.post(
            'https://n8n.wilkiedevs.com/webhook/tryon',
            json={
                'brand_id': 'test-brand',
                'product_id': 'test-product',
                'selfie_base64': PNG_B64,
                'product_image_url': 'https://minio.wilkiedevs.com/images/products/1773627349562-dca0d866bbf3.jpg',
                'prompt': 'Test: show person wearing the product',
            },
            headers={
                'Content-Type': 'application/json',
                'Authorization': 'Bearer Travis2305**',
            },
            timeout=60
        )
        print(f'\nWebhook response: HTTP {r.status_code}')
        print(f'Body: "{r.text[:300]}"')
    except Exception as e:
        print(f'Error webhook: {e}')

t = threading.Thread(target=call_webhook)
t.start()

# Esperar un poco y capturar logs
time.sleep(5)
print('\n=== Logs n8n DURANTE ejecución ===')
logs_during = run('docker logs root-n8n-1 --tail 30 2>&1')
print(logs_during)

t.join(timeout=70)

print('\n=== Logs n8n DESPUÉS del test ===')
logs_after = run('docker logs root-n8n-1 --tail 30 2>&1')
print(logs_after)

client.close()
