"""Obtener el error exacto de la última ejecución fallida via SSH directo a la DB de n8n"""
import paramiko, json

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

# Obtener últimas ejecuciones
execs_raw = run(f'curl -s -H "X-N8N-API-KEY: {N8N_API_KEY}" "http://{n8n_ip}:5678/api/v1/executions?workflowId={WF_ID}&limit=5"')
execs = json.loads(execs_raw)
items = execs.get('data', [])

print(f'Últimas {len(items)} ejecuciones:')
for ex in items:
    print(f'  ID={ex["id"]} status={ex["status"]} start={ex.get("startedAt","")[:19]}')

# Intentar obtener el detalle completo incluyendo datos de ejecución
# Algunos endpoints de n8n incluyen includeData=true
last_id = items[0]['id'] if items else None
if last_id:
    print(f'\n--- Detalle ejecución {last_id} con includeData ---')
    detail_raw = run(f'curl -s -H "X-N8N-API-KEY: {N8N_API_KEY}" "http://{n8n_ip}:5678/api/v1/executions/{last_id}?includeData=true"')
    print(f'Raw (primeros 2000 chars):')
    print(detail_raw[:2000])

# También intentar via SQLite directamente si n8n usa SQLite
print('\n--- Buscando DB de n8n ---')
db_path = run('find /root -name "*.sqlite" 2>/dev/null | head -5')
print(f'SQLite files: {db_path}')

# Ver variables de entorno de n8n para encontrar DB
n8n_env = run('docker exec root-n8n-1 env | grep -i "db\\|database\\|sqlite\\|postgres" 2>/dev/null')
print(f'n8n DB env: {n8n_env[:300]}')

client.close()
