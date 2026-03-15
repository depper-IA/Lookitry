import paramiko

HOST = '31.220.18.39'
PORT = 22
USER = 'root'
PASS = 'Travis18456916#'
NVM = 'export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh" && '

def run(client, cmd, timeout=30):
    print(f"\n>>> {cmd}")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode()
    err = stderr.read().decode()
    if out.strip():
        print(out.strip())
    if err.strip():
        print("ERR:", err.strip()[:200])
    return out, err

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, port=PORT, username=USER, password=PASS, timeout=15)
print("Conectado al VPS\n")

print("=" * 60)
print("PM2 STATUS")
print("=" * 60)
run(client, NVM + 'pm2 status')

print("\n" + "=" * 60)
print("LOGS BACKEND (ultimas 50 lineas)")
print("=" * 60)
run(client, NVM + 'pm2 logs virtual-tryon-backend --lines 50 --nostream')

print("\n" + "=" * 60)
print("HEALTH CHECK")
print("=" * 60)
run(client, 'curl -s http://localhost:3001/health')

print("\n" + "=" * 60)
print("NGINX STATUS")
print("=" * 60)
run(client, 'systemctl status nginx --no-pager | head -20')

client.close()
