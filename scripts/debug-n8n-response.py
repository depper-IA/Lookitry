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

# Ver la ultima ejecucion del workflow
exec_list = run(f'curl -s -H "X-N8N-API-KEY: {N8N_API_KEY}" "http://{n8n_ip}:5678/api/v1/executions?workflowId=wPLypk7KhBcFLicX&limit=3"')
data = json.loads(exec_list)

print(f'Ultimas ejecuciones del workflow Virtual Try-On:')
for ex in data.get('data', []):
    print(f'\n  ID: {ex["id"]} | Status: {ex["status"]} | Fecha: {ex.get("startedAt", "?")}')

    # Ver detalle de la ejecucion
    exec_detail = run(f'curl -s -H "X-N8N-API-KEY: {N8N_API_KEY}" "http://{n8n_ip}:5678/api/v1/executions/{ex["id"]}"')
    try:
        detail = json.loads(exec_detail)
        # Buscar el nodo "Preparar Respuesta" o "Responder Exito" para ver el output
        nodes_data = detail.get('data', {}).get('resultData', {}).get('runData', {})
        for node_name in ['Preparar Respuesta', 'Subir Imagen Final', 'Responder Exito']:
            if node_name in nodes_data:
                node_out = nodes_data[node_name]
                if node_out and len(node_out) > 0:
                    output = node_out[0].get('data', {}).get('main', [[]])[0]
                    if output:
                        print(f'  [{node_name}] output: {json.dumps(output[0].get("json", {}))[:400]}')
    except Exception as e:
        print(f'  Error parseando detalle: {e}')

client.close()
