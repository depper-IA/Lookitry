import paramiko, json

host = '31.220.18.39'
user = 'root'
pwd = 'Travis18456916#'
N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NGUxZTYyYi1kY2M0LTRiZGUtOWFjZS02OTBmMjAxMGIyMDAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiZWE2NmI1N2ItNTBiNS00ZTViLWJhYzYtZDE2MWFkM2NkZTkzIiwiaWF0IjoxNzczMjc5MzMyfQ.ZuYsz4K4ifpp9ho_nZzpDypTy49_APNx9hkecKridJw'
EXEC_ID = '13253'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=pwd, timeout=30)

def run(cmd):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=30)
    return stdout.read().decode()

n8n_ip = run("docker inspect root-n8n-1 --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'").strip()

raw = run(f'curl -s -H "X-N8N-API-KEY: {N8N_API_KEY}" "http://{n8n_ip}:5678/api/v1/executions/{EXEC_ID}?includeData=true"')
detail = json.loads(raw)
run_data = detail.get('data', {}).get('resultData', {}).get('runData', {})

# Ver exactamente qué campos tiene el nodo Extraer Imagen Base64
node = 'Extraer Imagen Base64'
if node in run_data:
    items = run_data[node][0].get('data', {}).get('main', [[]])[0]
    if items:
        first = items[0].get('json', {})
        print(f'Campos en [{node}]:')
        for k, v in first.items():
            if isinstance(v, str) and len(v) > 100:
                print(f'  {k}: [base64 de {len(v)} chars]')
            else:
                print(f'  {k}: {v}')

# Ver también el nodo Subir Imagen Final — qué body envía
node2 = 'Subir Imagen Final'
if node2 in run_data:
    items2 = run_data[node2][0].get('data', {}).get('main', [[]])[0]
    if items2:
        first2 = items2[0].get('json', {})
        print(f'\nRespuesta de [{node2}]:')
        print(json.dumps(first2, indent=2))

client.close()
