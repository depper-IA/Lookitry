"""
Ver la última ejecución del workflow para entender dónde falla
"""
import paramiko, json

host = '31.220.18.39'
user = 'root'
pwd  = 'Travis18456916#'
N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NGUxZTYyYi1kY2M0LTRiZGUtOWFjZS02OTBmMjAxMGIyMDAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiZWE2NmI1N2ItNTBiNS00ZTViLWJhYzYtZDE2MWFkM2NkZTkzIiwiaWF0IjoxNzczMjc5MzMyfQ.ZuYsz4K4ifpp9ho_nZzpDypTy49_APNx9hkecKridJw'
WF_ID = 'wPLypk7KhBcFLicX'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=pwd, timeout=30)

def run(cmd):
    _, stdout, _ = client.exec_command(cmd, timeout=30)
    return stdout.read().decode()

n8n_ip = run("docker inspect root-n8n-1 --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'").strip()

# Obtener últimas ejecuciones
execs_raw = run(
    f'curl -s "http://{n8n_ip}:5678/api/v1/executions?workflowId={WF_ID}&limit=3" '
    f'-H "X-N8N-API-KEY: {N8N_API_KEY}"'
)
execs = json.loads(execs_raw)
items = execs.get('data', [])
print(f'Últimas {len(items)} ejecuciones:\n')

for ex in items:
    ex_id = ex.get('id')
    status = ex.get('status')
    started = ex.get('startedAt', '')
    finished = ex.get('stoppedAt', '')
    print(f'ID: {ex_id} | Status: {status} | {started[:19]} → {finished[:19]}')

if not items:
    print('No hay ejecuciones registradas')
    client.close()
    exit()

# Ver detalle de la más reciente
latest_id = items[0]['id']
print(f'\n=== Detalle ejecución {latest_id} ===')
detail_raw = run(
    f'curl -s "http://{n8n_ip}:5678/api/v1/executions/{latest_id}" '
    f'-H "X-N8N-API-KEY: {N8N_API_KEY}"'
)
detail = json.loads(detail_raw)

run_data = detail.get('data', {})
result_data = run_data.get('resultData', {})
run_execution = result_data.get('runData', {})

print(f'\nNodos ejecutados:')
for node_name, node_runs in run_execution.items():
    for run_item in node_runs:
        exec_status = run_item.get('executionStatus', 'unknown')
        error = run_item.get('error')
        print(f'  [{exec_status}] {node_name}')
        if error:
            msg = error.get('message', '')
            desc = error.get('description', '')
            print(f'    ERROR: {msg}')
            if desc:
                print(f'    DESC:  {desc[:300]}')

# Mostrar error global si existe
last_error = result_data.get('error')
if last_error:
    print(f'\nError global: {json.dumps(last_error, indent=2)[:500]}')

client.close()
