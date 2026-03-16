"""Inspeccionar el nodo Respond to Webhook y todos los nodos del workflow"""
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
wf_raw = run(f'curl -s -H "X-N8N-API-KEY: {N8N_API_KEY}" http://{n8n_ip}:5678/api/v1/workflows/{WF_ID}')
wf = json.loads(wf_raw)

print(f'Workflow: {wf["name"]}\n')
print(f'Total nodos: {len(wf.get("nodes", []))}\n')

for node in wf.get('nodes', []):
    name = node.get('name', '')
    ntype = node.get('type', '').split('.')[-1]
    params = node.get('parameters', {})
    
    print(f'[{ntype}] {name}')
    
    # Mostrar parámetros relevantes según tipo
    if 'respond' in ntype.lower() or 'respond' in name.lower():
        print(f'  respondWith: {params.get("respondWith")}')
        print(f'  responseBody: {str(params.get("responseBody", ""))[:200]}')
        print(f'  options: {params.get("options", {})}')
        print(f'  PARAMS COMPLETOS: {json.dumps(params)[:400]}')
    elif 'webhook' in ntype.lower():
        print(f'  path: {params.get("path")}')
        print(f'  responseMode: {params.get("responseMode")}')
        print(f'  httpMethod: {params.get("httpMethod")}')
    elif 'code' in ntype.lower() or 'function' in ntype.lower():
        code = params.get('jsCode') or params.get('functionCode', '')
        print(f'  code: {code[:150]}')
    elif 'set' in ntype.lower():
        print(f'  values: {json.dumps(params.get("values", {}))[:200]}')
    print()

client.close()
