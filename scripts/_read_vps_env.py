import paramiko, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '../backend/.env'))

HOST = '31.220.18.39'
USER = 'root'
PASS = os.getenv('VPS_PASS')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASS, timeout=30)
print('Conectado al VPS')

_, stdout, _ = ssh.exec_command('cat /root/Lookitry/backend/.env.production')
print(stdout.read().decode())

ssh.close()
