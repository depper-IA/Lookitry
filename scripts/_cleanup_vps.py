import paramiko, time

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('31.220.18.39', username='root', password='Travis18456916#', timeout=15)

def run(cmd, wait=10):
    chan = ssh.get_transport().open_session()
    chan.exec_command(cmd)
    time.sleep(wait)
    out = b""
    while chan.recv_ready():
        out += chan.recv(65536)
    chan.close()
    return out.decode().strip()

print("=== DISCO ANTES ===")
print(run("df -h /", wait=4))

# ── 1. Playwright caches (root) ──────────────────────────────────────────────
print("\n=== [1/6] Borrando Playwright cache /root ===")
print(run("rm -rf /root/.cache/ms-playwright && echo OK", wait=10))

# ── 2. Playwright caches (ubuntu) ───────────────────────────────────────────
print("\n=== [2/6] Borrando Playwright cache /home/ubuntu ===")
print(run("rm -rf /home/ubuntu/.cache/ms-playwright && echo OK", wait=10))

# ── 3. venv de /root (contiene playwright driver) ───────────────────────────
print("\n=== [3/6] Borrando /root/venv (Python + Playwright) ===")
print(run("rm -rf /root/venv && echo OK", wait=10))

# ── 4. Bot superprof completo ────────────────────────────────────────────────
print("\n=== [4/6] Borrando superprof_bot ===")
print(run("rm -rf /home/ubuntu/superprof_bot && echo OK", wait=10))

# ── 5. Limpiar ejecuciones antiguas de n8n (febrero hacia atrás) ─────────────
# n8n guarda ejecuciones en SQLite. Usamos el API REST de n8n para borrarlas.
# Fecha límite: 2026-03-01 (borra todo lo anterior a marzo 2026)
print("\n=== [5/6] Limpiando ejecuciones n8n anteriores a marzo 2026 ===")
# Primero verificamos cuántas hay
print("Contando ejecuciones...")
print(run(
    "curl -s -X GET 'http://localhost:5678/api/v1/executions?limit=1' "
    "-H 'X-N8N-API-KEY: Travis2305**' | python3 -c \"import sys,json; d=json.load(sys.stdin); print('Total aprox:', d.get('count', 'N/A'))\" 2>/dev/null || echo 'No se pudo consultar API'",
    wait=8
))

# Borrar ejecuciones antiguas via SQLite directamente (más eficiente)
# Primero hacer backup del tamaño actual
print("Tamaño SQLite antes:")
print(run("ls -lh /var/lib/docker/volumes/n8n_data/_data/database.sqlite", wait=4))

# Borrar ejecuciones anteriores a 2026-03-01 directamente en SQLite
# n8n usa la tabla 'execution_entity' con campo 'startedAt'
print("Borrando ejecuciones antiguas en SQLite...")
print(run(
    "docker exec root-n8n-1 sqlite3 /home/node/.n8n/database.sqlite "
    "\"DELETE FROM execution_entity WHERE startedAt < '2026-03-01T00:00:00.000Z'; "
    "SELECT changes() as deleted_rows;\" 2>/dev/null || "
    # Si no tiene sqlite3 en el contenedor, usar desde el host
    "sqlite3 /var/lib/docker/volumes/n8n_data/_data/database.sqlite "
    "\"DELETE FROM execution_entity WHERE startedAt < '2026-03-01T00:00:00.000Z'; "
    "SELECT changes() as deleted_rows;\"",
    wait=20
))

# VACUUM para recuperar espacio físico en el archivo SQLite
print("Ejecutando VACUUM en SQLite (puede tardar)...")
print(run(
    "sqlite3 /var/lib/docker/volumes/n8n_data/_data/database.sqlite 'VACUUM;' && echo 'VACUUM OK'",
    wait=60
))

print("Tamaño SQLite después:")
print(run("ls -lh /var/lib/docker/volumes/n8n_data/_data/database.sqlite", wait=4))

# ── 6. Limpiar screenshots del bot que quedaron en /root ─────────────────────
print("\n=== [6/6] Limpiando screenshots y archivos temporales del bot ===")
print(run("find /root -name '*.png' -not -path '*/virtual-tryon/*' -delete 2>/dev/null && echo OK", wait=8))
print(run("find /home/ubuntu -name '*.png' -not -path '*/superprof_bot/*' -delete 2>/dev/null && echo OK", wait=8))

# ── Resultado final ──────────────────────────────────────────────────────────
print("\n=== DISCO DESPUES ===")
print(run("df -h /", wait=4))

print("\n=== RESUMEN DE LO QUE QUEDA EN /root ===")
print(run("ls -lh /root/ 2>/dev/null", wait=5))

print("\n=== RESUMEN DE LO QUE QUEDA EN /home/ubuntu ===")
print(run("ls -lh /home/ubuntu/ 2>/dev/null", wait=5))

ssh.close()
print("\n=== LIMPIEZA COMPLETADA ===")
