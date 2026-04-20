import paramiko
import os

HOST = '31.220.18.39'
USER = 'root'
PASS = 'Travis18456916#'
REPO = '/root/virtual-tryon'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASS, timeout=30)

# Upload backend env file using sftp
sftp = ssh.open_sftp()
sftp.put('backend/.env.production', f'{REPO}/backend/.env.production')
print(f'Uploaded backend/.env.production')

# Upload frontend env file if exists
if os.path.exists('frontend/.env.production'):
    sftp.put('frontend/.env.production', f'{REPO}/frontend/.env.production')
    print(f'Uploaded frontend/.env.production')

sftp.close()

# Check files uploaded
stdin, stdout, stderr = ssh.exec_command(f'ls -la {REPO}/backend/.env.production {REPO}/frontend/.env.production 2>&1', timeout=10)
print(stdout.read().decode())

ssh.close()
print('Done!')