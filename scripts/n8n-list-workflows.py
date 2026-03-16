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
    out = stdout.read().decode()
    err = stderr.read().decode()
    return out, err

# Probar conectividad con n8n
out, err = run('curl -s -o /dev/null -w "%{http_code}" http://localhost:5678/healthz')
print(f"n8n health: {out}")

# Probar API con key
out, err = run(f'curl -s -w "\\nHTTP:%{{http_code}}" -H "X-N8N-API-KEY: {N8N_API_KEY}" http://localhost:5678/api/v1/workflows?limit=5')
print(f"API response:\n{out}")
if err:
    print(f"STDERR: {err}")

client.close()
