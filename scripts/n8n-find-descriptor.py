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

# Listar página 2 también
for cursor in ['', '&cursor=50']:
    wf_list = run(f'curl -s -H "X-N8N-API-KEY: {N8N_API_KEY}" "http://{n8n_ip}:5678/api/v1/workflows?limit=100{cursor}"')
    data = json.loads(wf_list)
    for wf in data.get('data', []):
        name_lower = wf['name'].lower()
        if 'descriptor' in name_lower or 'tryon' in name_lower or 'try' in name_lower or 'virtual' in name_lower or 'prueba' in name_lower or 'selfie' in name_lower:
            print(f'MATCH -> ID: {wf["id"]} | Nombre: {wf["name"]} | Activo: {wf["active"]}')

    # Mostrar todos por si acaso
    print(f'\n--- Pagina (cursor={cursor or "inicio"}) ---')
    for wf in data.get('data', []):
        print(f'  {wf["id"]} | {wf["name"]} | activo={wf["active"]}')

    next_cursor = data.get('nextCursor')
    print(f'nextCursor: {next_cursor}')
    if not next_cursor:
        break

client.close()
