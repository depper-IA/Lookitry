import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('31.220.18.39', username='root', password='Travis18456916#', timeout=10)

cmds = [
    'docker builder prune -f',
    'cd /root/Lookitry && docker compose -f docker-compose.backend.yml build --no-cache 2>&1 | tail -25',
    'cd /root/Lookitry && docker compose -f docker-compose.backend.yml up -d 2>&1',
    'docker ps --format "table {{.Names}}  {{.Status}}" | grep lookitry',
    'curl -s -w "\\nHTTP: %{http_code}" https://api.lookitry.com/health',
]

for cmd in cmds:
    print(f'\n$ {cmd}')
    stdin, stdout, stderr = client.exec_command(cmd, timeout=120)
    out = stdout.read().decode()
    err = stderr.read().decode()
    if out: print(out)
    if err: print(err)

client.close()
