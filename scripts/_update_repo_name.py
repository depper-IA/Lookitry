import paramiko, os, time
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '../backend/.env'))

HOST = '31.220.18.39'
USER = 'root'
PASS = os.getenv('VPS_PASS')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASS, timeout=30)
print('Conectado al VPS')

# 1. Actualizar GITHUB_REPO en .env.production
cmd1 = "sed -i 's|GITHUB_REPO=https://github.com/depper-IA/virtual-tryon.git|GITHUB_REPO=https://github.com/depper-IA/Lookitry.git|g' /root/virtual-tryon/backend/.env.production"
ssh.exec_command(cmd1)
time.sleep(1)

_, out, _ = ssh.exec_command('grep GITHUB_REPO /root/virtual-tryon/backend/.env.production')
print('GITHUB_REPO en VPS:', out.read().decode().strip())

# 2. Actualizar git remote en el VPS
_, out, err = ssh.exec_command('cd /root/virtual-tryon && git remote set-url origin https://github.com/depper-IA/Lookitry.git')
time.sleep(1)
_, out, _ = ssh.exec_command('cd /root/virtual-tryon && git remote -v')
print('Git remote VPS:', out.read().decode().strip())

ssh.close()
print('Listo.')
