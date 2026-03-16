"""Verificar qué modelo de Gemini con capacidad de imagen está disponible en OpenRouter"""
import paramiko, json

host = '31.220.18.39'
user = 'root'
pwd  = 'Travis18456916#'
N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NGUxZTYyYi1kY2M0LTRiZGUtOWFjZS02OTBmMjAxMGIyMDAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiZWE2NmI1N2ItNTBiNS00ZTViLWJhYzYtZDE2MWFkM2NkZTkzIiwiaWF0IjoxNzczMjc5MzMyfQ.ZuYsz4K4ifpp9ho_nZzpDypTy49_APNx9hkecKridJw'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=pwd, timeout=30)

def run(cmd):
    _, stdout, _ = client.exec_command(cmd, timeout=60)
    return stdout.read().decode()

n8n_ip = run("docker inspect root-n8n-1 --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'").strip()

# Obtener la API key de OpenRouter desde las credenciales de n8n
# Buscar en la DB SQLite de n8n
print('Buscando credenciales de OpenRouter en n8n...')
creds_raw = run(f'curl -s -H "X-N8N-API-KEY: {N8N_API_KEY}" http://{n8n_ip}:5678/api/v1/credentials')
creds = json.loads(creds_raw)
print(f'Credenciales encontradas: {len(creds.get("data", []))}')
for c in creds.get('data', []):
    print(f'  - {c.get("name")} [{c.get("type")}]')

# Intentar obtener la API key de OpenRouter desde el contenedor
print('\nBuscando API key de OpenRouter en variables de entorno del contenedor n8n...')
env_vars = run('docker exec root-n8n-1 env | grep -i "openrouter\\|OPENROUTER" 2>/dev/null')
print(f'Env vars: {env_vars or "(ninguna)"}')

# Ver si hay archivos de configuración
config_files = run('docker exec root-n8n-1 find /home/node -name "*.json" 2>/dev/null | head -5')
print(f'Config files: {config_files}')

client.close()
