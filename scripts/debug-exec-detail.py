import paramiko, json

host = '31.220.18.39'
user = 'root'
pwd = 'Travis18456916#'
N8N_API_KEY = '***REMOVED-SECRET***'
EXEC_ID = '13253'  # la mas reciente exitosa

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=pwd, timeout=30)

def run(cmd):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=30)
    return stdout.read().decode()

n8n_ip = run("docker inspect root-n8n-1 --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'").strip()

raw = run(f'curl -s -H "X-N8N-API-KEY: {N8N_API_KEY}" "http://{n8n_ip}:5678/api/v1/executions/{EXEC_ID}?includeData=true"')
detail = json.loads(raw)

run_data = detail.get('data', {}).get('resultData', {}).get('runData', {})
print(f'Nodos ejecutados: {list(run_data.keys())}')

for node_name, node_runs in run_data.items():
    if not node_runs:
        continue
    try:
        items = node_runs[0].get('data', {}).get('main', [[]])[0]
        if items:
            first = items[0].get('json', {})
            # Solo mostrar nodos relevantes con URLs o success
            s = json.dumps(first)
            if any(k in s for k in ['url', 'success', 'imageUrl', 'error']):
                print(f'\n[{node_name}]')
                # Truncar base64 si hay
                if 'base64' in s.lower() or len(s) > 500:
                    # Mostrar solo campos no-base64
                    clean = {k: v for k, v in first.items() if not isinstance(v, str) or len(v) < 300}
                    print(json.dumps(clean, indent=2)[:600])
                else:
                    print(json.dumps(first, indent=2)[:600])
    except Exception as e:
        print(f'[{node_name}] error: {e}')

client.close()
