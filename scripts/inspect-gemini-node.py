"""Inspeccionar el nodo Generar con Gemini"""
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

for node in wf.get('nodes', []):
    if node.get('name') == 'Generar con Gemini':
        print('=== Nodo: Generar con Gemini ===')
        print(f'Tipo: {node.get("type")}')
        params = node.get('parameters', {})
        # Mostrar todo excepto valores muy largos
        def truncate(v, n=200):
            s = str(v)
            return s[:n] + '...' if len(s) > n else s
        for k, v in params.items():
            print(f'  {k}: {truncate(v)}')
        print()
        print('PARAMS COMPLETOS:')
        print(json.dumps(params, indent=2)[:3000])
        break

# También ver el nodo "Preparar Prompt Gemini" para entender qué datos pasa
for node in wf.get('nodes', []):
    if node.get('name') == 'Preparar Prompt Gemini':
        print('\n=== Nodo: Preparar Prompt Gemini ===')
        print(node['parameters'].get('jsCode', '')[:800])
        break

client.close()
