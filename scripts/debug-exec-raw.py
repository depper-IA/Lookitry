"""Ver el error raw de la última ejecución fallida y el detalle de la exitosa"""
import paramiko, json

host = '31.220.18.39'
user = 'root'
pwd  = 'Travis18456916#'
N8N_API_KEY = '***REMOVED-SECRET***'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=pwd, timeout=30)

def run(cmd):
    _, stdout, _ = client.exec_command(cmd, timeout=30)
    return stdout.read().decode()

n8n_ip = run("docker inspect root-n8n-1 --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'").strip()

for exec_id in [13254, 13253]:
    print(f'\n{"="*50}')
    print(f'Ejecución {exec_id}')
    print('='*50)
    raw = run(f'curl -s -H "X-N8N-API-KEY: {N8N_API_KEY}" "http://{n8n_ip}:5678/api/v1/executions/{exec_id}"')
    detail = json.loads(raw)

    status = detail.get('status')
    print(f'Status: {status}')

    # Error a nivel de ejecución
    exec_error = detail.get('data', {}).get('resultData', {}).get('error')
    if exec_error:
        print(f'Error ejecución: {json.dumps(exec_error)[:400]}')

    # Nodos
    run_data = detail.get('data', {}).get('resultData', {}).get('runData', {})
    if run_data:
        print(f'\nNodos ({len(run_data)}):')
        for node_name, node_runs in run_data.items():
            for run_item in node_runs:
                exec_status = run_item.get('executionStatus', '?')
                error = run_item.get('error')
                print(f'  [{exec_status}] {node_name}')
                if error:
                    print(f'    ERROR: {json.dumps(error)[:300]}')
                output = run_item.get('data', {}).get('main', [[]])
                if output and output[0]:
                    first = output[0][0] if output[0] else {}
                    jd = first.get('json', {})
                    safe = {k: (str(v)[:60] + '...' if isinstance(v, str) and len(str(v)) > 60 else v)
                            for k, v in jd.items()
                            if k not in ('selfie_base64', 'generated_image_base64', 'image_base64')}
                    if safe:
                        print(f'    Output: {json.dumps(safe)[:250]}')
    else:
        # Mostrar raw truncado para ver qué hay
        print(f'Sin runData. Raw (primeros 800 chars):')
        print(raw[:800])

client.close()
