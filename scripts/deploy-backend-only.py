import paramiko, time

host = '31.220.18.39'
user = 'root'
pwd = 'Travis18456916#'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=pwd, timeout=30)

def run(cmd, timeout=600):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode()
    err = stderr.read().decode()
    return out + (('\nSTDERR: ' + err) if err.strip() else '')

print('=== git pull ===')
print(run('cd /root/virtual-tryon && git pull origin main'))

print('\n=== rebuild backend ===')
print(run('cd /root/virtual-tryon && docker compose -f docker-compose.backend.yml build --no-cache 2>&1 | tail -15', timeout=600))

print('\n=== up backend ===')
print(run('cd /root/virtual-tryon && docker compose -f docker-compose.backend.yml up -d 2>&1'))

time.sleep(4)

print('\n=== verify ===')
print(run('curl -s -w "\\nHTTP: %{http_code}" https://api.pruebalo.wilkiedevs.com/health'))
print(run('curl -s -w "\\nHTTP: %{http_code}" -X POST https://api.pruebalo.wilkiedevs.com/api/upload/selfie -H "Content-Type: application/json" -d "{}"'))

client.close()
print('\nDONE')
