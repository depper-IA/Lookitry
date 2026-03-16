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
print('n8n IP:', n8n_ip)

# 1. Eliminar workflow inactivo Ft86NDu6ZJCyOpgD
del_result = run(f'curl -s -X DELETE -H "X-N8N-API-KEY: {N8N_API_KEY}" http://{n8n_ip}:5678/api/v1/workflows/Ft86NDu6ZJCyOpgD')
print('DELETE inactivo:', del_result[:300])

# 2. Listar todos los workflows para encontrar 'descriptor'
wf_list = run(f'curl -s -H "X-N8N-API-KEY: {N8N_API_KEY}" http://{n8n_ip}:5678/api/v1/workflows?limit=50')
data = json.loads(wf_list)
print('\nWorkflows disponibles:')
for wf in data.get('data', []):
    print(f'  ID: {wf["id"]} | Nombre: {wf["name"]} | Activo: {wf["active"]}')

client.close()
