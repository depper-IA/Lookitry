"""Inspeccionar conexiones del workflow para ver qué nodos están desconectados"""
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

nodes = wf.get('nodes', [])
connections = wf.get('connections', {})

print('=== NODOS ===')
for n in nodes:
    print(f'  [{n["type"].split(".")[-1]}] {n["name"]}')

print('\n=== CONEXIONES (source → target) ===')
for src_name, src_conns in connections.items():
    for conn_type, outputs in src_conns.items():
        for output_idx, targets in enumerate(outputs):
            if targets:
                for t in targets:
                    print(f'  {src_name} → {t["node"]}')

# Detectar nodos sin conexión entrante (excepto el Webhook que es el inicio)
print('\n=== NODOS SIN CONEXIÓN ENTRANTE ===')
all_targets = set()
for src_name, src_conns in connections.items():
    for conn_type, outputs in src_conns.items():
        for output_idx, targets in enumerate(outputs):
            if targets:
                for t in targets:
                    all_targets.add(t['node'])

for n in nodes:
    name = n['name']
    node_type = n['type']
    if name not in all_targets and 'webhook' not in node_type.lower():
        print(f'  HUERFANO: {name} ({node_type})')

client.close()
