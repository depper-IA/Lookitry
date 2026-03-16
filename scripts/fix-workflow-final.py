"""
Fix definitivo del workflow wPLypk7KhBcFLicX:
1. Eliminar nodos "Modo Test?" y "Mock Imagen (Test)"
2. Reconectar: Preparar Prompt Gemini --> Generar con Gemini (directo)
3. Limpiar nodo "Subir Imagen Final": usar solo jsonBody sin conflicto con bodyParameters
4. Verificar que "Preparar Respuesta" referencia correctamente el campo url de la respuesta
"""
import paramiko, json, copy

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

def api_put(path, body):
    body_json = json.dumps(body)
    # Escribir a archivo temporal en el VPS para evitar problemas de escape
    run(f"cat > /tmp/wf_payload.json << 'ENDOFPAYLOAD'\n{body_json}\nENDOFPAYLOAD")
    out = run(f"curl -s -X PUT -H 'X-N8N-API-KEY: {N8N_API_KEY}' -H 'Content-Type: application/json' -d @/tmp/wf_payload.json http://{n8n_ip}:5678{path}")
    return out

n8n_ip = run("docker inspect root-n8n-1 --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'").strip()
print(f'n8n IP: {n8n_ip}')

wf_raw = run(f'curl -s -H "X-N8N-API-KEY: {N8N_API_KEY}" http://{n8n_ip}:5678/api/v1/workflows/{WF_ID}')
wf = json.loads(wf_raw)
print(f'Workflow: {wf["name"]} ({len(wf["nodes"])} nodos)')

nodes = wf.get('nodes', [])
connections = wf.get('connections', {})

# --- 1. Eliminar nodos "Modo Test?" y "Mock Imagen (Test)" ---
nodes_to_remove = {'Modo Test?', 'Mock Imagen (Test)'}
new_nodes = [n for n in nodes if n.get('name') not in nodes_to_remove]
print(f'\nNodos eliminados: {nodes_to_remove}')
print(f'Nodos restantes: {len(new_nodes)}')

# --- 2. Limpiar conexiones y reconectar ---
# Eliminar conexiones de los nodos removidos
new_connections = {}
for from_node, outputs in connections.items():
    if from_node in nodes_to_remove:
        continue
    new_outputs = {}
    for output_key, targets_list in outputs.items():
        new_targets_list = []
        for targets in targets_list:
            if targets is None:
                new_targets_list.append(None)
                continue
            filtered = [t for t in targets if t.get('node') not in nodes_to_remove]
            new_targets_list.append(filtered)
        new_outputs[output_key] = new_targets_list
    new_connections[from_node] = new_outputs

# Reconectar: "Preparar Prompt Gemini" --[0]--> "Generar con Gemini"
new_connections['Preparar Prompt Gemini'] = {
    'main': [[{'node': 'Generar con Gemini', 'type': 'main', 'index': 0}]]
}
print('\nConexion actualizada: Preparar Prompt Gemini --> Generar con Gemini')

# --- 3. Limpiar nodo "Subir Imagen Final" ---
# Usar SOLO jsonBody limpio, sin bodyParameters conflictivos
for node in new_nodes:
    if node.get('name') == 'Subir Imagen Final':
        node['parameters'] = {
            'method': 'POST',
            'url': 'https://api.pruebalo.wilkiedevs.com/api/upload/selfie',
            'authentication': 'genericCredentialType',
            'genericAuthType': 'httpHeaderAuth',
            'sendBody': True,
            'contentType': 'json',
            'specifyBody': 'json',
            'jsonBody': '{"image_base64": "={{ $json.generated_image_base64 }}", "filename": "=tryon-{{ $json.brand_id }}-{{ $json.product_id }}-{{ $json.timestamp_safe }}.jpg", "temporary": false}',
            'sendHeaders': True,
            'headerParameters': {
                'parameters': [
                    {'name': 'Authorization', 'value': 'Bearer Travis2305**'},
                    {'name': 'Content-Type', 'value': 'application/json'}
                ]
            },
            'options': {'timeout': 30000}
        }
        print('Nodo "Subir Imagen Final" limpiado (solo jsonBody, sin bodyParameters)')

# --- 4. Verificar "Preparar Respuesta" ---
for node in new_nodes:
    if node.get('name') == 'Preparar Respuesta':
        assignments = node.get('parameters', {}).get('assignments', {}).get('assignments', [])
        for a in assignments:
            if a.get('name') == 'imageUrl':
                print(f'\n"Preparar Respuesta" imageUrl referencia: {a.get("value")}')
                # Debe ser $("Subir Imagen Final").item.json.url
                # Verificar que sea correcto
                if 'Subir Imagen Final' in a.get('value', '') and '.url' in a.get('value', ''):
                    print('  -> OK: referencia correcta a .url')
                else:
                    print('  -> CORRIGIENDO referencia...')
                    a['value'] = '={{ $("Subir Imagen Final").item.json.url }}'

# --- 5. Guardar workflow ---
print('\nGuardando workflow...')
payload = {
    'name': wf['name'],
    'nodes': new_nodes,
    'connections': new_connections,
    'settings': wf.get('settings', {}),
    'staticData': wf.get('staticData'),
}

# Escribir payload a archivo en VPS
payload_json = json.dumps(payload)
# Usar python en el VPS para hacer el PUT (evita problemas de escape con curl)
script = f"""
import urllib.request, json
payload = {repr(payload_json)}
req = urllib.request.Request(
    'http://{n8n_ip}:5678/api/v1/workflows/{WF_ID}',
    data=payload.encode('utf-8'),
    method='PUT',
    headers={{
        'X-N8N-API-KEY': '{N8N_API_KEY}',
        'Content-Type': 'application/json'
    }}
)
with urllib.request.urlopen(req, timeout=30) as resp:
    body = resp.read().decode('utf-8')
    data = json.loads(body)
    print('ID:', data.get('id'))
    print('Name:', data.get('name'))
    print('Nodes:', len(data.get('nodes', [])))
"""

run(f"cat > /tmp/update_wf.py << 'ENDSCRIPT'\n{script}\nENDSCRIPT")
result = run('python3 /tmp/update_wf.py')
print(f'Resultado: {result}')

client.close()
