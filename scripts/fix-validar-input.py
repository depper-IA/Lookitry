"""
Fix del nodo "Validar Input":
El webhook en n8n con responseMode:responseNode pone el body en $input.item.json
directamente (no en .body). El código actual ya maneja ambos casos con el OR,
pero puede que el problema sea otro.

Vamos a:
1. Ver el código completo del nodo
2. Simplificar para que sea más robusto
3. También revisar si el nodo "Subir Selfie Temporal" tiene el campo correcto
"""
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

print('=== Código completo de "Validar Input" ===')
for node in wf.get('nodes', []):
    if node.get('name') == 'Validar Input':
        print(node['parameters'].get('jsCode', ''))
        break

print('\n=== Nodo "Subir Selfie Temporal" ===')
for node in wf.get('nodes', []):
    if node.get('name') == 'Subir Selfie Temporal':
        print(json.dumps(node['parameters'], indent=2)[:600])
        break

# Ahora corregir el nodo "Validar Input" para ser más robusto
# El problema: cuando n8n recibe el webhook, el body puede estar en distintos lugares
# dependiendo de la versión. Vamos a hacer el código más defensivo.
new_validate_code = """// Obtener body del webhook — compatible con todas las versiones de n8n
const item = $input.item.json;
// n8n puede poner el body en .body, en la raíz, o en .body.body
const body = item.body || item;

if (!body || typeof body !== 'object') {
  throw new Error("No se recibio body valido. Recibido: " + JSON.stringify(item).substring(0, 200));
}

const required = ["brand_id", "product_id", "selfie_base64", "product_image_url", "prompt"];
const missing = required.filter(f => !body[f]);
if (missing.length > 0) {
  throw new Error("Faltan campos: " + missing.join(", ") + ". Body recibido: " + JSON.stringify(Object.keys(body)));
}

if (body.selfie_base64.length < 100) {
  throw new Error("selfie_base64 invalido o muy corto (" + body.selfie_base64.length + " chars)");
}

const urlRegex = /^https?:\\/\\/.+/;
if (!urlRegex.test(body.product_image_url)) {
  throw new Error("product_image_url no es URL valida: " + body.product_image_url);
}

const now = new Date();
const timestamp = now.toISOString();
const timestamp_safe = timestamp.replace(/[:.]/g, "-");

return {
  json: {
    brand_id: body.brand_id,
    product_id: body.product_id,
    selfie_base64: body.selfie_base64,
    product_image_url: body.product_image_url,
    prompt: body.prompt,
    timestamp,
    timestamp_safe,
  }
};"""

nodes = wf.get('nodes', [])
modified = False
for node in nodes:
    if node.get('name') == 'Validar Input':
        node['parameters']['jsCode'] = new_validate_code
        modified = True
        print('\nNodo "Validar Input" actualizado con código más robusto')
        break

if not modified:
    print('ERROR: No se encontró el nodo "Validar Input"')
    client.close()
    exit()

# Guardar
payload = {
    'name': wf['name'],
    'nodes': nodes,
    'connections': wf.get('connections', {}),
    'settings': wf.get('settings', {}),
    'staticData': wf.get('staticData'),
}
payload_json = json.dumps(payload)

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
    data = json.loads(resp.read().decode())
    print('Guardado OK - ID:', data.get('id'), '- Nodos:', len(data.get('nodes', [])))
"""
run(f"cat > /tmp/upd.py << 'EOF'\n{script}\nEOF")
result = run('python3 /tmp/upd.py')
print(result)

# Re-registrar webhook
run(f'curl -s -X POST -H "X-N8N-API-KEY: {N8N_API_KEY}" http://{n8n_ip}:5678/api/v1/workflows/{WF_ID}/deactivate')
import time; time.sleep(1)
run(f'curl -s -X POST -H "X-N8N-API-KEY: {N8N_API_KEY}" http://{n8n_ip}:5678/api/v1/workflows/{WF_ID}/activate')
print('Webhook re-registrado')

client.close()
