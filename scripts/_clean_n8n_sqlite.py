import paramiko, time

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('31.220.18.39', username='root', password='Travis18456916#', timeout=15)

def run(cmd, wait=15):
    chan = ssh.get_transport().open_session()
    chan.exec_command(cmd)
    time.sleep(wait)
    out = b""
    while chan.recv_ready():
        out += chan.recv(65536)
    chan.close()
    return out.decode().strip()

DB = "/var/lib/docker/volumes/n8n_data/_data/database.sqlite"

print("=== Instalando sqlite3 en el host ===")
print(run("apt-get install -y sqlite3 2>&1 | tail -3", wait=20))

print("\n=== Tamaño SQLite ANTES ===")
print(run(f"ls -lh {DB}", wait=4))

print("\n=== Tablas disponibles ===")
print(run(f"sqlite3 {DB} '.tables'", wait=8))

print("\n=== Contando ejecuciones totales ===")
print(run(f"sqlite3 {DB} 'SELECT COUNT(*) as total FROM execution_entity;'", wait=8))

print("\n=== Ejecuciones por mes ===")
print(run(
    f"sqlite3 {DB} \"SELECT substr(startedAt,1,7) as mes, COUNT(*) as cantidad "
    f"FROM execution_entity GROUP BY mes ORDER BY mes DESC LIMIT 10;\"",
    wait=8
))

print("\n=== Borrando ejecuciones anteriores a 2026-03-01 ===")
print(run(
    f"sqlite3 {DB} \"DELETE FROM execution_entity WHERE startedAt < '2026-03-01T00:00:00.000Z'; "
    f"SELECT changes() || ' filas eliminadas';\"",
    wait=20
))

print("\n=== Ejecuciones restantes ===")
print(run(f"sqlite3 {DB} 'SELECT COUNT(*) as restantes FROM execution_entity;'", wait=8))

print("\n=== VACUUM (recuperar espacio físico — puede tardar 1-2 min) ===")
print(run(f"sqlite3 {DB} 'VACUUM;' && echo 'VACUUM OK'", wait=120))

print("\n=== Tamaño SQLite DESPUES ===")
print(run(f"ls -lh {DB}", wait=4))

print("\n=== DISCO FINAL ===")
print(run("df -h /", wait=4))

# Verificar que n8n sigue funcionando
print("\n=== n8n sigue corriendo ===")
print(run("docker ps --filter name=n8n --format '{{.Names}}  {{.Status}}'", wait=5))

ssh.close()
print("\n=== FIN ===")
