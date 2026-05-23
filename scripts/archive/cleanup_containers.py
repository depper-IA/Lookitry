import paramiko

HOST = '31.220.18.39'
USER = 'root'
PASS = 'Travis18456916#'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASS, timeout=30)

# Force remove all conflicting containers
stdin, stdout, stderr = ssh.exec_command('docker ps -a --format "{{.Names}}" 2>&1', timeout=30)
containers = stdout.read().decode().strip()
print('All containers:', containers)

# Remove lookitry containers
for c in ['lookitry-frontend', 'lookitry-backend', 'lookitry-error-pages', 'root-n8n-1', 'minio', 'root-redis-1']:
    stdin, stdout, stderr = ssh.exec_command(f'docker rm -f {c} 2>&1', timeout=30)
    out = stdout.read().decode()
    if out.strip():
        print(f'Removed {c}: {out.strip()}')

# Also stop any projects that have orphaned containers
stdin, stdout, stderr = ssh.exec_command('docker ps --format "{{.Names}}"', timeout=30)
print('Remaining containers:', stdout.read().decode().strip())

ssh.close()
print('Done!')