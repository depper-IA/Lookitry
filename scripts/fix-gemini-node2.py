"""
Fix v2: usar solo los campos que acepta la API PUT de n8n
(name, nodes, connections, settings, staticData)
"""
import paramiko, json, sys

host = '31.220.18.39'
user = 'root'
pwd  = 'Travis18456916#'
N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NGUxZTYyYi1kY2M0LTRiZGUtOWFjZS02OTBmMjAxMGIyMDAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiZWE2NmI1N2ItNTBiNS00ZTViLWJhYzYtZDE2MWFkM2NkZTkzIiwiaWF0IjoxNzczMjc5MzMyfQ.ZuYsz4K4ifpp9ho_nZzpDypTy49_APNx9hkecKridJw'
WF_ID = 'wPLypk7KhBcFLicX'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=pwd, timeout=30)

def run(cmd):
    _, stdout, stderr = client.exec_command(cmd, timeout=60)
    return stdout.read().decode(), stderr.read().decode()

def put_via_stdin(url, headers_dict, payload_bytes):
    header_str = ' '.join(f'-H "{k}: {v}"' for k, v in headers_dict.items())
    cmd = f'curl -s -X PUT {url} {header_str} --data-binary @-'
    transport = client.get_transport()
    chan = transport.open_session()
    chan.exec_command(cmd)
    chan.sendall(payload_bytes)
    chan.shutdown_write()
    result = b''
    while True:
        chunk = chan.recv(4096)
        if not chunk:
            break
        result += chunk
    return result.decode('utf-8')

n8n_ip, _ = run("docker inspect root-n8n-1 --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'")
n8n_ip = n8n_ip.strip()
print(f'n8n IP: {n8n_ip}')

# Obtener workflow completo
wf_raw, _ = run(f'curl -s -H "X-N8N-API-KEY: {N8N_API_KEY}" http://{n8n_ip}:5678/api/v1/workflows/{WF_ID}')
wf = json.loads(wf_raw)

nodes = wf.get('nodes', [])
modified = False

for node in nodes:
    if node.get('name') == 'Generar con Gemini':
        print('Encontrado nodo "Generar con Gemini"')
        
        # Usar selfie_url (URL pública de MinIO) en lugar de base64 JPEG
        new_json_body = (
            '={{ JSON.stringify({'
            '  "model": "google/gemini-2.5-flash-image",'
            '  "modalities": ["image", "text"],'
            '  "messages": [{'
            '    "role": "user",'
            '    "content": ['
            '      { "type": "text", "text": $json.full_prompt },'
            '      { "type": "image_url", "image_url": { "url": $json.selfie_url } },'
            '      { "type": "image_url", "image_url": { "url": $json.product_image_url } }'
            '    ]'
            '  }],'
            '  "max_tokens": 1024,'
            '  "temperature": 0.3'
            '}) }}'
        )
        
        node['parameters']['jsonBody'] = new_json_body
        modified = True
        print('Nodo modificado: usa selfie_url en lugar de base64')
        break

if not modified:
    print('ERROR: No se encontró el nodo')
    client.close()
    sys.exit(1)

# Construir payload solo con campos aceptados por la API
put_body = {
    'name': wf['name'],
    'nodes': wf['nodes'],
    'connections': wf['connections'],
    'settings': wf.get('settings', {}),
    'staticData': wf.get('staticData'),
}

payload_bytes = json.dumps(put_body).encode('utf-8')
print(f'Payload size: {len(payload_bytes)} bytes')

result = put_via_stdin(
    f'http://{n8n_ip}:5678/api/v1/workflows/{WF_ID}',
    {
        'X-N8N-API-KEY': N8N_API_KEY,
        'Content-Type': 'application/json',
    },
    payload_bytes
)

try:
    resp = json.loads(result)
    if resp.get('id') == WF_ID:
        print(f'Workflow actualizado: {resp["id"]} — activo: {resp.get("active")}')
    else:
        print(f'Respuesta: {result[:400]}')
except Exception as e:
    print(f'Error: {e} — raw: {result[:300]}')

client.close()
