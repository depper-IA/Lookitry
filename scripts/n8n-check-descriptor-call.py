import paramiko, json

host = '31.220.18.39'
user = 'root'
pwd = 'Travis18456916#'
N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NGUxZTYyYi1kY2M0LTRiZGUtOWFjZS02OTBmMjAxMGIyMDAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiZWE2NmI1N2ItNTBiNS00ZTViLWJhYzYtZDE2MWFkM2NkZTkzIiwiaWF0IjoxNzczMjc5MzMyfQ.ZuYsz4K4ifpp9ho_nZzpDypTy49_APNx9hkecKridJw'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=pwd, timeout=30)

def run(cmd):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=30)
    return stdout.read().decode()

n8n_ip = run("docker inspect root-n8n-1 --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'").strip()

# Buscar en TODOS los workflows activos cualquier referencia a "descriptor" o "wp-json" o "wordpress"
wf_list_raw = run(f'curl -s -H "X-N8N-API-KEY: {N8N_API_KEY}" "http://{n8n_ip}:5678/api/v1/workflows?limit=100&active=true"')
data = json.loads(wf_list_raw)

print('Buscando referencias a "descriptor", "wp-json", "wordpress" en workflows activos...\n')
for wf in data.get('data', []):
    wf_detail_raw = run(f'curl -s -H "X-N8N-API-KEY: {N8N_API_KEY}" http://{n8n_ip}:5678/api/v1/workflows/{wf["id"]}')
    try:
        wf_detail = json.loads(wf_detail_raw)
    except:
        continue
    wf_str = json.dumps(wf_detail).lower()
    if 'descriptor' in wf_str or 'wp-json' in wf_str or 'wordpress.com' in wf_str or 'pruebalo.wilkiedevs.com/wp' in wf_str:
        print(f'MATCH en: {wf["name"]} (ID: {wf["id"]})')
        # Mostrar nodos con esas referencias
        for node in wf_detail.get('nodes', []):
            node_str = json.dumps(node).lower()
            if 'descriptor' in node_str or 'wp-json' in node_str:
                print(f'  Nodo: {node["name"]}')
                print(f'  Params: {json.dumps(node.get("parameters", {}))[:400]}')

client.close()
print('\nDone.')
