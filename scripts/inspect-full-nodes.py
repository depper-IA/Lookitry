"""Inspeccionar nodos críticos del workflow en detalle"""
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
wf_raw = run(f'curl -s -H "X-N8N-API-KEY: {N8N_API_KEY}" http://{n8n_ip}:5678/api/v1/workflows/{WF_ID}')
wf = json.loads(wf_raw)

# Nodos a inspeccionar en detalle
target_nodes = ['Modo Test?', 'Mock Imagen (Test)', 'Preparar Respuesta', 'Extraer Imagen Base64', 'Subir Imagen Final']

for node in wf.get('nodes', []):
    name = node.get('name', '')
    if name in target_nodes:
        print(f'\n{"="*60}')
        print(f'NODO: {name}  [{node.get("type","").split(".")[-1]}]')
        print('='*60)
        params = node.get('parameters', {})
        print(json.dumps(params, indent=2)[:1500])

# También mostrar las conexiones para entender el flujo
print(f'\n{"="*60}')
print('CONEXIONES DEL WORKFLOW')
print('='*60)
connections = wf.get('connections', {})
for from_node, outputs in connections.items():
    for output_idx, targets in enumerate(outputs.get('main', [])):
        for target in (targets or []):
            to_node = target.get('node')
            print(f'  {from_node} --[{output_idx}]--> {to_node}')

client.close()
