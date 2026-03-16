import paramiko, json

host = '31.220.18.39'
user = 'root'
pwd = 'Travis18456916#'
N8N_API_KEY = '***REMOVED-SECRET***'

WF_ID = 'wPLypk7KhBcFLicX'  # Virtual Try-On - Flujo Completo

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
print(f'ID: {wf.get("id")}')
print(f'Nodos totales: {len(wf.get("nodes", []))}')
print(f'\n{"="*60}')

for node in wf.get('nodes', []):
    params = node.get('parameters', {})
    print(f'\nNodo: [{node["type"]}] {node["name"]}')
    # Buscar cualquier referencia a URLs, WordPress, MinIO, imágenes
    params_str = json.dumps(params)
    if any(k in params_str.lower() for k in ['wp-json', 'wordpress', 'wilkiedevs', 'minio', 'image_url', 'product_image', 'http', 'url']):
        print(json.dumps(params, indent=2, ensure_ascii=False)[:1500])
    else:
        print('  (sin URLs relevantes)')

client.close()
