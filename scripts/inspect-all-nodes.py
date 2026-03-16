"""Inspeccionar el código de todos los nodos Code del workflow"""
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

for node in wf.get('nodes', []):
    name = node['name']
    ntype = node['type']
    params = node.get('parameters', {})
    
    print(f'\n{"="*60}')
    print(f'NODO: {name}  [{ntype}]')
    
    if 'code' in ntype.lower():
        code = params.get('jsCode', params.get('code', ''))
        print(code)
    elif ntype == 'n8n-nodes-base.set':
        print(json.dumps(params, indent=2)[:600])
    elif ntype == 'n8n-nodes-base.respondToWebhook':
        print(json.dumps(params, indent=2))
    elif ntype == 'n8n-nodes-base.httpRequest':
        # Solo mostrar url y body
        print(f'URL: {params.get("url")}')
        print(f'Method: {params.get("method")}')
        body = params.get('jsonBody', params.get('body', ''))
        print(f'Body (primeros 300): {str(body)[:300]}')

client.close()
