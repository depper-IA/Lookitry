"""Desactivar y reactivar workflow para forzar re-registro del webhook"""
import paramiko, json, time

host = '31.220.18.39'
user = 'root'
pwd  = 'Travis18456916#'
N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NGUxZTYyYi1kY2M0LTRiZGUtOWFjZS02OTBmMjAxMGIyMDAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiZWE2NmI1N2ItNTBiNS00ZTViLWJhYzYtZDE2MWFkM2NkZTkzIiwiaWF0IjoxNzczMjc5MzMyfQ.ZuYsz4K4ifpp9ho_nZzpDypTy49_APNx9hkecKridJw'
WF_ID = 'wPLypk7KhBcFLicX'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=pwd, timeout=30)

def run(cmd):
    _, stdout, _ = client.exec_command(cmd, timeout=30)
    return stdout.read().decode()

n8n_ip = run("docker inspect root-n8n-1 --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'").strip()

# Ver endpoints disponibles
print('Probando endpoints de activación...')

# Intentar POST /activate y POST /deactivate
r1 = run(f'curl -s -X POST -H "X-N8N-API-KEY: {N8N_API_KEY}" http://{n8n_ip}:5678/api/v1/workflows/{WF_ID}/deactivate')
print(f'POST /deactivate: {r1[:150]}')

time.sleep(2)

r2 = run(f'curl -s -X POST -H "X-N8N-API-KEY: {N8N_API_KEY}" http://{n8n_ip}:5678/api/v1/workflows/{WF_ID}/activate')
print(f'POST /activate: {r2[:150]}')

time.sleep(2)

# Verificar estado final
wf_raw = run(f'curl -s -H "X-N8N-API-KEY: {N8N_API_KEY}" http://{n8n_ip}:5678/api/v1/workflows/{WF_ID}')
wf = json.loads(wf_raw)
print(f'\nEstado final: active={wf.get("active")}')

client.close()
