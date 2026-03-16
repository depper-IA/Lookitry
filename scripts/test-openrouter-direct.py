"""
Probar OpenRouter directamente con la API key del workflow para ver el error exacto.
Primero extraemos la API key de la credencial 'Open Pruebalo' de n8n.
"""
import paramiko, json, requests

host = '31.220.18.39'
user = 'root'
pwd  = 'Travis18456916#'
N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NGUxZTYyYi1kY2M0LTRiZGUtOWFjZS02OTBmMjAxMGIyMDAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiZWE2NmI1N2ItNTBiNS00ZTViLWJhYzYtZDE2MWFkM2NkZTkzIiwiaWF0IjoxNzczMjc5MzMyfQ.ZuYsz4K4ifpp9ho_nZzpDypTy49_APNx9hkecKridJw'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=pwd, timeout=30)

def run(cmd):
    _, stdout, _ = client.exec_command(cmd, timeout=30)
    return stdout.read().decode()

n8n_ip = run("docker inspect root-n8n-1 --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'").strip()

# Buscar la credencial que usa el nodo "Generar con Gemini"
# Primero ver qué credencial usa el nodo
WF_ID = 'wPLypk7KhBcFLicX'
wf_raw = run(f'curl -s -H "X-N8N-API-KEY: {N8N_API_KEY}" http://{n8n_ip}:5678/api/v1/workflows/{WF_ID}')
wf = json.loads(wf_raw)

for node in wf.get('nodes', []):
    if node.get('name') == 'Generar con Gemini':
        creds = node.get('credentials', {})
        print(f'Credenciales del nodo: {json.dumps(creds, indent=2)}')
        break

# Intentar obtener la API key via SQLite directamente
print('\nBuscando API key en SQLite de n8n...')
# n8n guarda las credenciales encriptadas, pero podemos ver el nombre
sqlite_query = """
SELECT name, type, data FROM credentials_entity 
WHERE name LIKE '%Open%' OR name LIKE '%openrouter%' OR name LIKE '%pruebalo%'
ORDER BY name;
"""
# Buscar la DB
db_path = run('find /root -name "database.sqlite" 2>/dev/null | head -3')
print(f'DB path: {db_path.strip()}')

if db_path.strip():
    db = db_path.strip().split('\n')[0]
    result = run(f'sqlite3 "{db}" "SELECT name, type FROM credentials_entity WHERE name LIKE \'%Open%\' OR name LIKE \'%pruebalo%\' OR name LIKE \'%openrouter%\';" 2>/dev/null')
    print(f'Credenciales encontradas:\n{result}')

client.close()
