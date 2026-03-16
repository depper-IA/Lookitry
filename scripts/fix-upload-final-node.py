import paramiko, json, copy

host = '31.220.18.39'
user = 'root'
pwd = 'Travis18456916#'
N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NGUxZTYyYi1kY2M0LTRiZGUtOWFjZS02OTBmMjAxMGIyMDAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiZWE2NmI1N2ItNTBiNS00ZTViLWJhYzYtZDE2MWFkM2NkZTkzIiwiaWF0IjoxNzczMjc5MzMyfQ.ZuYsz4K4ifpp9ho_nZzpDypTy49_APNx9hkecKridJw'
WF_ID = 'wPLypk7KhBcFLicX'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=pwd, timeout=30)

def run(cmd):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=30)
    return stdout.read().decode()

def api_get(path):
    out = run(f'curl -s -H "X-N8N-API-KEY: {N8N_API_KEY}" http://{n8n_ip}:5678{path}')
    return json.loads(out)

def api_put(path, body):
    body_escaped = json.dumps(body).replace("'", "'\\''")
    out = run(f"curl -s -X PUT -H 'X-N8N-API-KEY: {N8N_API_KEY}' -H 'Content-Type: application/json' -d '{body_escaped}' http://{n8n_ip}:5678{path}")
    return out

n8n_ip = run("docker inspect root-n8n-1 --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'").strip()
print(f'n8n IP: {n8n_ip}')

wf = api_get(f'/api/v1/workflows/{WF_ID}')
print(f'Workflow: {wf["name"]}')

nodes = wf.get('nodes', [])
modified = False

for node in nodes:
    name = node.get('name', '')
    params = node.get('parameters', {})

    if name == 'Subir Imagen Final':
        print(f'\nNodo encontrado: {name}')
        print(f'  jsonBody actual: {params.get("jsonBody", "")[:200]}')

        # Corregir: usar generated_image_base64 en lugar de image_base64
        # También corregir bodyParameters si los tiene
        body_params = params.get('bodyParameters', {}).get('parameters', [])
        for bp in body_params:
            if bp.get('name') == 'image_base64':
                bp['value'] = '={{ $json.generated_image_base64 }}'
                print(f'  Corregido bodyParameter image_base64 -> $json.generated_image_base64')

        # Corregir jsonBody también
        old_json_body = params.get('jsonBody', '')
        if 'image_base64' in old_json_body:
            new_json_body = old_json_body.replace(
                '"image_base64": "={{ $json.image_base64 }}"',
                '"image_base64": "={{ $json.generated_image_base64 }}"'
            )
            params['jsonBody'] = new_json_body
            print(f'  Corregido jsonBody: image_base64 -> generated_image_base64')
            print(f'  Nuevo jsonBody: {new_json_body[:200]}')

        node['parameters'] = params
        modified = True

if not modified:
    print('No se encontro el nodo Subir Imagen Final')
else:
    payload = {
        'name': wf['name'],
        'nodes': nodes,
        'connections': wf.get('connections', {}),
        'settings': wf.get('settings', {}),
        'staticData': wf.get('staticData'),
    }
    result = api_put(f'/api/v1/workflows/{WF_ID}', payload)
    try:
        r = json.loads(result)
        if r.get('id'):
            print(f'\nWorkflow guardado correctamente (ID: {r["id"]})')
        else:
            print(f'\nError al guardar: {result[:400]}')
    except:
        print(f'\nRespuesta raw: {result[:400]}')

client.close()
