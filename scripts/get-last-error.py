"""Ver el error exacto de la última ejecución"""
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

execs_raw = run(f'curl -s -H "X-N8N-API-KEY: {N8N_API_KEY}" "http://{n8n_ip}:5678/api/v1/executions?workflowId={WF_ID}&limit=1"')
last_id = json.loads(execs_raw)['data'][0]['id']

detail_raw = run(f'curl -s -H "X-N8N-API-KEY: {N8N_API_KEY}" "http://{n8n_ip}:5678/api/v1/executions/{last_id}?includeData=true"')
detail = json.loads(detail_raw)

error = detail.get('data', {}).get('resultData', {}).get('error', {})
print(f'Error message: {error.get("message")}')
print(f'Error node: {error.get("node", {}).get("name") if isinstance(error.get("node"), dict) else "N/A"}')
print(f'Stack (primeras 3 líneas):')
stack = error.get('stack', '')
for line in stack.split('\n')[:3]:
    print(f'  {line}')

# Ver runData para saber qué nodo ejecutó
run_data = detail.get('data', {}).get('resultData', {}).get('runData', {})
print(f'\nNodos ejecutados: {list(run_data.keys())}')

client.close()
