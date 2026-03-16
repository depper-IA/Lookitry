import paramiko

host = '31.220.18.39'
user = 'root'
pwd = 'Travis18456916#'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=pwd, timeout=30)

def run(cmd, timeout=30):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    return stdout.read().decode() + stderr.read().decode()

print("=== containers corriendo ===")
print(run('docker ps --format "{{.Names}} | {{.Ports}} | {{.Status}}"'))

print("\n=== n8n container inspect ===")
print(run('docker inspect n8n 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); p=d[0][\'NetworkSettings\'][\'Ports\']; print(p)" 2>/dev/null || echo "no container named n8n"'))

print("\n=== buscar n8n por nombre ===")
print(run('docker ps --filter name=n8n --format "{{.Names}} | {{.Ports}}"'))

print("\n=== puertos en uso ===")
print(run('ss -tlnp | grep -E "5678|n8n" 2>/dev/null || netstat -tlnp 2>/dev/null | grep -E "5678|n8n"'))

client.close()
