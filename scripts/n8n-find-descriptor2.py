import paramiko, json

host = '31.220.18.39'
user = 'root'
pwd = 'Travis18456916#'
N8N_API_KEY = '***REMOVED-SECRET***'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=pwd, timeout=30)

def run(cmd):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=30)
    return stdout.read().decode()

n8n_ip = run("docker inspect root-n8n-1 --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'").strip()

# Paginar con el cursor correcto
cursor = 'eyJsaW1pdCI6MTAwLCJvZmZzZXQiOjEwMH0='
wf_list = run(f'curl -s -H "X-N8N-API-KEY: {N8N_API_KEY}" "http://{n8n_ip}:5678/api/v1/workflows?limit=100&cursor={cursor}"')
data = json.loads(wf_list)

print('Workflows pagina 2:')
for wf in data.get('data', []):
    print(f'  {wf["id"]} | {wf["name"]} | activo={wf["active"]}')
    name_lower = wf['name'].lower()
    if any(k in name_lower for k in ['descriptor', 'tryon', 'try', 'virtual', 'prueba', 'selfie', 'wilkie']):
        print(f'  *** MATCH: {wf["name"]}')

print(f'\nnextCursor: {data.get("nextCursor")}')
client.close()
