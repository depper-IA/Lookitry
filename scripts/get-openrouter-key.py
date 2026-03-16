"""Obtener la API key de OpenRouter desde la DB de n8n dentro del contenedor"""
import paramiko, json

host = '31.220.18.39'
user = 'root'
pwd  = 'Travis18456916#'
N8N_API_KEY = '***REMOVED-SECRET***'
CRED_ID = 'zoSkapW7VQMaPW6Y'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=pwd, timeout=30)

def run(cmd):
    _, stdout, _ = client.exec_command(cmd, timeout=30)
    return stdout.read().decode()

n8n_ip = run("docker inspect root-n8n-1 --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'").strip()

# Buscar la DB dentro del contenedor
db_path = run('docker exec root-n8n-1 find /home/node -name "database.sqlite" 2>/dev/null')
print(f'DB dentro del contenedor: {db_path.strip()}')

if db_path.strip():
    db = db_path.strip().split('\n')[0]
    # Consultar la credencial — está encriptada pero podemos ver el tipo
    result = run(f'docker exec root-n8n-1 sqlite3 "{db}" "SELECT id, name, type FROM credentials_entity WHERE id=\'{CRED_ID}\';" 2>/dev/null')
    print(f'Credencial: {result}')

# Alternativa: usar la API de n8n para obtener el detalle de la credencial
# (solo devuelve metadata, no el valor encriptado)
cred_raw = run(f'curl -s -H "X-N8N-API-KEY: {N8N_API_KEY}" http://{n8n_ip}:5678/api/v1/credentials/{CRED_ID}')
print(f'\nAPI response: {cred_raw[:300]}')

# Ver el error completo de OpenRouter en la última ejecución
print('\n=== Error completo de la última ejecución ===')
execs_raw = run(f'curl -s -H "X-N8N-API-KEY: {N8N_API_KEY}" "http://{n8n_ip}:5678/api/v1/executions?workflowId=wPLypk7KhBcFLicX&limit=1"')
last_id = json.loads(execs_raw)['data'][0]['id']
detail_raw = run(f'curl -s -H "X-N8N-API-KEY: {N8N_API_KEY}" "http://{n8n_ip}:5678/api/v1/executions/{last_id}?includeData=true"')
detail = json.loads(detail_raw)

error = detail.get('data', {}).get('resultData', {}).get('error', {})
print(f'Message: {error.get("message")}')
print(f'Description: {error.get("description")}')

# Ver el runData del nodo Generar con Gemini
run_data = detail.get('data', {}).get('resultData', {}).get('runData', {})
gemini_run = run_data.get('Generar con Gemini', [])
if gemini_run:
    for item in gemini_run:
        err = item.get('error', {})
        if err:
            print(f'\nError del nodo:')
            print(json.dumps(err, indent=2)[:800])

client.close()
