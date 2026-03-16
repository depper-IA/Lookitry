import paramiko, json

host = '31.220.18.39'
user = 'root'
pwd = 'Travis18456916#'
N8N_API_KEY = '***REMOVED-SECRET***'
WF_IDS = ['wPLypk7KhBcFLicX', 'Ft86NDu6ZJCyOpgD']

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=pwd, timeout=30)

def run(cmd, timeout=30):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    return stdout.read().decode()

n8n_ip = run("docker inspect root-n8n-1 --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'").strip()

for wf_id in WF_IDS:
    out = run(f'curl -s -H "X-N8N-API-KEY: {N8N_API_KEY}" http://{n8n_ip}:5678/api/v1/workflows/{wf_id}')
    try:
        wf = json.loads(out)
        print(f"\n{'='*60}")
        print(f"Workflow: {wf.get('name')} (ID: {wf_id})")
        print(f"Activo: {wf.get('active')}")
        print(f"\nNodos:")
        for node in wf.get('nodes', []):
            name = node.get('name', '')
            ntype = node.get('type', '')
            params = node.get('parameters', {})
            url = params.get('url', '')
            method = params.get('method', '')
            print(f"  [{ntype}] {name}")
            if url:
                print(f"    URL: {url}")
            if method:
                print(f"    Method: {method}")
    except Exception as e:
        print(f"Error en {wf_id}: {e}\nRaw: {out[:300]}")

client.close()
