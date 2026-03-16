import paramiko, time

host = '31.220.18.39'
user = 'root'
pwd = 'Travis18456916#'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=pwd, timeout=30)

def run(cmd, timeout=30):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    return stdout.read().decode() + stderr.read().decode()

time.sleep(4)

print('=== /health ===')
print(run('curl -s -w "\\nHTTP: %{http_code}" https://api.pruebalo.wilkiedevs.com/health'))

print('\n=== /api/upload (debe ser 401) ===')
print(run('curl -s -w "\\nHTTP: %{http_code}" -X POST https://api.pruebalo.wilkiedevs.com/api/upload -H "Content-Type: application/json" -d "{}"'))

print('\n=== /api/products/upload (debe ser 401) ===')
print(run('curl -s -w "\\nHTTP: %{http_code}" -X POST https://api.pruebalo.wilkiedevs.com/api/products/upload -H "Content-Type: application/json" -d "{}"'))

print('\n=== containers status ===')
print(run('docker ps --filter name=virtual-tryon --format "{{.Names}} | {{.Status}}"'))

client.close()
print('\nVERIFICACION COMPLETA')
