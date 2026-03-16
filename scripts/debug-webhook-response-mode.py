"""
Diagnosticar el responseMode del webhook.
El webhook usa responseMode: responseNode — debe responder cuando el nodo
"Responder Exito" se ejecuta, NO inmediatamente.
Si responde vacío de inmediato, el workflow está fallando antes de llegar al nodo de respuesta.
"""
import paramiko, json, requests, time

host = '31.220.18.39'
user = 'root'
pwd  = 'Travis18456916#'
N8N_API_KEY = '***REMOVED-SECRET***'
WF_ID = 'wPLypk7KhBcFLicX'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=pwd, timeout=30)

def run(cmd):
    _, stdout, _ = client.exec_command(cmd, timeout=30)
    return stdout.read().decode()

n8n_ip = run("docker inspect root-n8n-1 --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'").strip()

# Ver el nodo Webhook completo
wf_raw = run(f'curl -s -H "X-N8N-API-KEY: {N8N_API_KEY}" http://{n8n_ip}:5678/api/v1/workflows/{WF_ID}')
wf = json.loads(wf_raw)

print('=== Nodo Webhook ===')
for node in wf.get('nodes', []):
    if node.get('type', '').endswith('webhook'):
        print(json.dumps(node.get('parameters', {}), indent=2))
        break

print('\n=== Nodo Validar Input ===')
for node in wf.get('nodes', []):
    if node.get('name') == 'Validar Input':
        print(json.dumps(node.get('parameters', {}), indent=2)[:800])
        break

# Disparar webhook y medir tiempo de respuesta
print('\n=== Test de tiempo de respuesta ===')
PNG_B64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg=='

start = time.time()
r = requests.post(
    'https://n8n.wilkiedevs.com/webhook/tryon',
    json={
        'brand_id': 'test',
        'product_id': 'test',
        'selfie_base64': PNG_B64,
        'product_image_url': 'https://minio.wilkiedevs.com/images/products/1773627349562-dca0d866bbf3.jpg',
        'prompt': 'test',
    },
    headers={'Authorization': 'Bearer Travis2305**'},
    timeout=30
)
elapsed = time.time() - start
print(f'Tiempo respuesta: {elapsed:.2f}s')
print(f'Status: {r.status_code}')
print(f'Body: "{r.text[:200]}"')

if elapsed < 1.0:
    print('\n-> Responde en <1s = el workflow falla INMEDIATAMENTE en el primer nodo')
    print('-> Revisar nodo "Validar Input" — probablemente lanza error por body mal formado')
else:
    print(f'\n-> Responde en {elapsed:.1f}s = el workflow ejecuta algo antes de responder')

# Ver última ejecución
time.sleep(2)
execs_raw = run(f'curl -s -H "X-N8N-API-KEY: {N8N_API_KEY}" "http://{n8n_ip}:5678/api/v1/executions?workflowId={WF_ID}&limit=1"')
execs = json.loads(execs_raw)
items = execs.get('data', [])
if items:
    ex = items[0]
    print(f'\nÚltima ejecución: ID={ex.get("id")} status={ex.get("status")} duración={ex.get("stoppedAt","")} - {ex.get("startedAt","")}')

client.close()
