import paramiko
import re

HOST = '31.220.18.39'
USER = 'root'
PASS = 'Travis18456916#'
REPO = '/root/virtual-tryon'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASS, timeout=30)

# Read vps-docker-compose.yml from local
with open('vps-docker-compose.yml', 'r', encoding='utf-8') as f:
    compose_content = f.read()

# Extract environment variables for backend
env_lines = []
in_backend = False
for line in compose_content.split('\n'):
    if 'backend:' in line:
        in_backend = True
    elif in_backend and ('frontend:' in line or 'redis:' in line):
        break
    elif in_backend and line.strip().startswith('- '):
        var = line.strip()[2:]
        if '=' in var and not var.startswith('#'):
            env_lines.append(var)

# Create new .env.production
env_content = '\n'.join(env_lines)
print(f'Extracted {len(env_lines)} environment variables for backend')

from io import BytesIO

# Upload to VPS
sftp = ssh.open_sftp()
bio = BytesIO(env_content.encode())
sftp.putfo(bio, remotepath=f'{REPO}/backend/.env.production')
sftp.close()

# Verify
stdin, stdout, stderr = ssh.exec_command(f'grep MINIO {REPO}/backend/.env.production', timeout=10)
print('MINIO vars:', stdout.read().decode())

ssh.close()
print('Done!')