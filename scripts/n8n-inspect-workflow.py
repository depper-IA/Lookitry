import paramiko, json

host = '31.220.18.39'
user = 'root'
pwd = 'Travis18456916#'
N8N_API_KEY = '***REMOVED-SECRET***'

# ID del workflow "Describir con IA" — el más cercano a "descriptor"
WF_ID = 'ZjVTV3QxoPEi60GX'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=pwd, timeout=30)

def run(cmd):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=30)
    return stdout.read().decode()

n8n_ip = run("docker inspect root-n8n-1 --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'").strip()

wf_raw = run(f'curl -s -H "X-N8N-API-KEY: {N8N_API_KEY}" http://{n8n_ip}:5678/api/v1/workflows/{WF_ID}')
wf = json.loads(wf_raw)

print(f'Nombre: {wf.get("name")}')
print(f'Activo: {wf.get("active")}')
print(f'ID: {wf.get("id")}')
print(f'\nNodos ({len(wf.get("nodes", []))}):')
for node in wf.get('nodes', []):
    params = node.get('parameters', {})
    url = params.get('url', '')
    webhook_path = params.get('path', '')
    print(f'  [{node["type"]}] {node["name"]}')
    if url:
        print(f'    URL: {url}')
    if webhook_path:
        print(f'    Webhook path: {webhook_path}')
    # Mostrar body/json si tiene
    body = params.get('jsonBody', params.get('body', ''))
    if body:
        print(f'    Body: {str(body)[:200]}')

client.close()
