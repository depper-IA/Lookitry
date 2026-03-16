"""Ver logs recientes de n8n para identificar el error"""
import paramiko

host = '31.220.18.39'
user = 'root'
pwd  = 'Travis18456916#'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=pwd, timeout=30)

def run(cmd):
    _, stdout, _ = client.exec_command(cmd, timeout=30)
    return stdout.read().decode()

# Últimas 80 líneas de logs de n8n
logs = run('docker logs root-n8n-1 --tail 80 2>&1')
print(logs)

client.close()
