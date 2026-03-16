"""
Fix: cambiar el nodo "Generar con Gemini" para usar la URL de la selfie
en lugar del base64 JPEG (que Gemini rechaza).

La selfie ya está subida a MinIO por el nodo "Subir Selfie Temporal",
su URL está disponible en $json.selfie_url.
"""
import paramiko, json, sys

host = '31.220.18.39'
user = 'root'
pwd  = 'Travis18456916#'
N8N_API_KEY = '***REMOVED-SECRET***'
WF_ID = 'wPLypk7KhBcFLicX'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=pwd, timeout=30)

def run(cmd):
    _, stdout, stderr = client.exec_command(cmd, timeout=60)
    out = stdout.read().decode()
    err = stderr.read().decode()
    return out, err

n8n_ip, _ = run("docker inspect root-n8n-1 --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'")
n8n_ip = n8n_ip.strip()
print(f'n8n IP: {n8n_ip}')

# Obtener workflow completo
wf_raw, err = run(f'curl -s -H "X-N8N-API-KEY: {N8N_API_KEY}" http://{n8n_ip}:5678/api/v1/workflows/{WF_ID}')
wf = json.loads(wf_raw)

nodes = wf.get('nodes', [])
modified = False

for node in nodes:
    if node.get('name') == 'Generar con Gemini':
        print('Encontrado nodo "Generar con Gemini"')
        
        # Nuevo jsonBody: usar selfie_url (URL pública de MinIO) en lugar de base64
        # OpenRouter puede descargar imágenes desde URLs públicas sin problema
        new_json_body = '''={{ JSON.stringify({
  "model": "google/gemini-2.5-flash-image",
  "modalities": ["image", "text"],
  "messages": [{
    "role": "user",
    "content": [
      { "type": "text", "text": $json.full_prompt },
      { "type": "image_url", "image_url": { "url": $json.selfie_url } },
      { "type": "image_url", "image_url": { "url": $json.product_image_url } }
    ]
  }],
  "max_tokens": 1024,
  "temperature": 0.3
}) }}'''
        
        node['parameters']['jsonBody'] = new_json_body
        modified = True
        print('Nodo modificado: ahora usa selfie_url (URL de MinIO) en lugar de base64')
        break

if not modified:
    print('ERROR: No se encontró el nodo "Generar con Gemini"')
    client.close()
    sys.exit(1)

# Guardar workflow actualizado via stdin para evitar problemas con comillas
payload_bytes = json.dumps(wf).encode('utf-8')

update_cmd = (
    f'curl -s -X PUT http://{n8n_ip}:5678/api/v1/workflows/{WF_ID}'
    f' -H "X-N8N-API-KEY: {N8N_API_KEY}"'
    f' -H "Content-Type: application/json"'
    f' --data-binary @-'
)

ssh_transport = client.get_transport()
chan = ssh_transport.open_session()
chan.exec_command(update_cmd)
chan.sendall(payload_bytes)
chan.shutdown_write()

result = b''
while True:
    chunk = chan.recv(4096)
    if not chunk:
        break
    result += chunk
result = result.decode('utf-8')
err = ''
if err:
    print(f'STDERR: {err[:200]}')

try:
    resp = json.loads(result)
    if resp.get('id') == WF_ID:
        print(f'Workflow actualizado correctamente: {resp["id"]}')
        print(f'Nombre: {resp.get("name")}')
        print(f'Activo: {resp.get("active")}')
    else:
        print(f'Respuesta inesperada: {result[:300]}')
except Exception as e:
    print(f'Error parseando respuesta: {e}')
    print(f'Raw: {result[:300]}')

client.close()
