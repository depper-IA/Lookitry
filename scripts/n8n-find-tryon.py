import paramiko, json

host = '31.220.18.39'
user = 'root'
pwd = 'Travis18456916#'
N8N_API_KEY = '***REMOVED-SECRET***'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=pwd, timeout=30)

def run(cmd, timeout=30):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    return stdout.read().decode()

n8n_ip = run("docker inspect root-n8n-1 --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'").strip()

# Paginar todos los workflows
all_workflows = []
cursor = None
page = 1
while True:
    url = f'http://{n8n_ip}:5678/api/v1/workflows?limit=50'
    if cursor:
        url += f'&cursor={cursor}'
    out = run(f'curl -s -H "X-N8N-API-KEY: {N8N_API_KEY}" "{url}"')
    try:
        data = json.loads(out)
    except:
        print(f"Error en página {page}: {out[:200]}")
        break
    
    batch = data.get('data', [])
    all_workflows.extend(batch)
    
    next_cursor = data.get('nextCursor')
    if not next_cursor or not batch:
        break
    cursor = next_cursor
    page += 1

print(f"Total workflows encontrados: {len(all_workflows)}")

# Buscar los relacionados con tryon/probador/selfie/upload/wilkie
keywords = ['tryon', 'try-on', 'try_on', 'probador', 'selfie', 'wilkie', 'virtual', 'upload', 'gemini', 'imagen']
print("\n=== Workflows relevantes ===")
for wf in all_workflows:
    name_lower = wf['name'].lower()
    if any(k in name_lower for k in keywords):
        print(f"\nID: {wf['id']}")
        print(f"Nombre: {wf['name']}")
        print(f"Activo: {wf.get('active', False)}")

# También mostrar los activos
print("\n=== Todos los workflows ACTIVOS ===")
for wf in all_workflows:
    if wf.get('active'):
        print(f"ID: {wf['id']} | {wf['name']}")

client.close()
