import paramiko, time

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('31.220.18.39', username='root', password='Travis18456916#', timeout=15)

def run_bg(cmd, wait=5):
    chan = ssh.get_transport().open_session()
    chan.exec_command(cmd)
    time.sleep(wait)
    out = b""
    while chan.recv_ready():
        out += chan.recv(8192)
    chan.close()
    return out.decode().strip()

# Lanzar builds en background con logs
print("Lanzando build backend en background...")
print(run_bg(
    "cd /root/virtual-tryon && docker compose -f docker-compose.backend.yml build > /tmp/build_backend.log 2>&1 && "
    "docker compose -f docker-compose.backend.yml up -d >> /tmp/build_backend.log 2>&1 && echo 'BACKEND_DONE' >> /tmp/build_backend.log &",
    wait=3
))

print("Lanzando build frontend en background...")
print(run_bg(
    "cd /root/virtual-tryon && docker compose -f docker-compose.frontend.yml build > /tmp/build_frontend.log 2>&1 && "
    "docker compose -f docker-compose.frontend.yml up -d >> /tmp/build_frontend.log 2>&1 && echo 'FRONTEND_DONE' >> /tmp/build_frontend.log &",
    wait=3
))

print("Builds lanzados. Esperando 4 minutos...")
time.sleep(240)

print("\n=== LOG BACKEND (últimas 20 líneas) ===")
print(run_bg("tail -20 /tmp/build_backend.log 2>/dev/null", wait=3))

print("\n=== LOG FRONTEND (últimas 20 líneas) ===")
print(run_bg("tail -20 /tmp/build_frontend.log 2>/dev/null", wait=3))

print("\n=== CONTENEDORES ACTIVOS ===")
print(run_bg('docker ps --format "{{.Names}}  {{.Status}}"', wait=3))

print("\n=== DISCO ===")
print(run_bg("df -h /", wait=3))

ssh.close()
print("\n=== FIN ===")
