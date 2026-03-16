import paramiko, json

host = '31.220.18.39'
user = 'root'
pwd = 'Travis18456916#'
N8N_API_KEY = '***REMOVED-SECRET***'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=pwd, timeout=30)

def run(cmd, timeout=30):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    return stdout.read().decode()

# Obtener IP del contenedor n8n
n8n_ip = run("docker inspect root-n8n-1 --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'").strip()
print(f"n8n IP: {n8n_ip}")

# Listar workflows via IP interna
out = run(f'curl -s -H "X-N8N-API-KEY: {N8N_API_KEY}" http://{n8n_ip}:5678/api/v1/workflows?limit=20')
print(f"\nRaw response (primeros 500 chars):\n{out[:500]}")

try:
    data = json.loads(out)
    print(f"\nTotal workflows: {len(data.get('data', []))}")
    for wf in data.get('data', []):
        print(f"\nID: {wf['id']} | Nombre: {wf['name']} | Activo: {wf.get('active', False)}")
except Exception as e:
    print(f"Error parseando JSON: {e}")

client.close()
