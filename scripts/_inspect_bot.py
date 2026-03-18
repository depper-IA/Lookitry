import paramiko, time

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('31.220.18.39', username='root', password='Travis18456916#', timeout=15)

def run(cmd, wait=8):
    chan = ssh.get_transport().open_session()
    chan.exec_command(cmd)
    time.sleep(wait)
    out = b""
    while chan.recv_ready():
        out += chan.recv(65536)
    chan.close()
    return out.decode().strip()

print("=== ESTRUCTURA DEL BOT ===")
print(run("find /home/ubuntu/superprof_bot -type f | head -60", wait=8))

print("\n=== ARCHIVOS .py PRINCIPALES ===")
print(run("find /home/ubuntu/superprof_bot -name '*.py' -not -path '*/venv/*' | head -20", wait=5))

print("\n=== README si existe ===")
print(run("cat /home/ubuntu/superprof_bot/README* 2>/dev/null || echo 'Sin README'", wait=5))

print("\n=== requirements.txt ===")
print(run("cat /home/ubuntu/superprof_bot/requirements.txt 2>/dev/null || echo 'Sin requirements.txt'", wait=5))

print("\n=== .env o config del bot ===")
print(run("cat /home/ubuntu/superprof_bot/.env 2>/dev/null || cat /home/ubuntu/superprof_bot/config.py 2>/dev/null || echo 'Sin .env ni config.py'", wait=5))

print("\n=== ARCHIVO PRINCIPAL (main/bot) ===")
print(run("cat /home/ubuntu/superprof_bot/main.py 2>/dev/null || cat /home/ubuntu/superprof_bot/bot.py 2>/dev/null || echo 'No encontrado'", wait=5))

print("\n=== PAQUETES INSTALADOS EN VENV ===")
print(run("cat /home/ubuntu/superprof_bot/venv/lib/python3.12/site-packages/playwright/__init__.py 2>/dev/null | head -5; pip list --path /home/ubuntu/superprof_bot/venv/lib/python3.12/site-packages 2>/dev/null | head -30 || ls /home/ubuntu/superprof_bot/venv/lib/python3.12/site-packages/ | grep -v '__' | head -30", wait=8))

print("\n=== SERVICIOS SYSTEMD DEL BOT ===")
print(run("systemctl list-units --all | grep -i superprof 2>/dev/null || echo 'Sin servicio systemd'", wait=5))

print("\n=== CRONTABS ===")
print(run("crontab -l 2>/dev/null; crontab -u ubuntu -l 2>/dev/null || echo 'Sin crontab'", wait=5))

ssh.close()
print("\n=== FIN INSPECCION ===")
