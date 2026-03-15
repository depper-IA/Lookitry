import paramiko
import time
import sys

HOST = '31.220.18.39'
PORT = 22
USER = 'root'
PASS = 'Travis18456916#'

def run_command(client, cmd, timeout=120):
    print(f"\n>>> {cmd[:80]}...")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode()
    err = stderr.read().decode()
    if out:
        print(out)
    if err:
        print("STDERR:", err[:500])
    return out, err

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, port=PORT, username=USER, password=PASS, timeout=15)
print("Conectado al VPS")

# Instalar nvm y Node.js 20
install_nvm = (
    'curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash && '
    'export NVM_DIR="$HOME/.nvm" && '
    '[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" && '
    'nvm install 20 && nvm use 20 && nvm alias default 20 && '
    'node --version && npm --version'
)
run_command(client, install_nvm, timeout=180)

# Instalar PM2 globalmente
run_command(client, (
    'export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh" && '
    'npm install -g pm2 && pm2 --version'
), timeout=60)

# Agregar nvm al .bashrc para que persista
run_command(client, (
    'grep -q "NVM_DIR" /root/.bashrc || echo \'export NVM_DIR="$HOME/.nvm"\n[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"\' >> /root/.bashrc'
))

print("\nNode.js y PM2 instalados correctamente")
client.close()
