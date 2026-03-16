import paramiko, time

HOST = '31.220.18.39'
PORT = 22
USER = 'root'
PASS = 'Travis18456916#'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, port=PORT, username=USER, password=PASS, timeout=15)

def run(cmd, timeout=20):
    _, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    return out + ('\n[STDERR]: ' + err if err else '')

# Hacer el request y capturar el exit code del contenedor
backend_ip = run('docker inspect virtual-tryon-backend --format "{{range .NetworkSettings.Networks}}{{.IPAddress}} {{end}}"').strip().split()[0]

# Lanzar request
run(f'curl -s --max-time 8 -X POST http://{backend_ip}:3001/api/auth/register -H "Content-Type: application/json" -d \'{{"email":"exitcode@test.com","password":"Test1234!","name":"Exit Test","slug":"exit-test-x1"}}\' > /tmp/r.txt 2>&1 &')

time.sleep(3)

# Ver el exit code del contenedor (si murió)
print("=== Exit code del contenedor ===")
print(run('docker inspect virtual-tryon-backend --format "ExitCode: {{.State.ExitCode}} | Status: {{.State.Status}} | Error: {{.State.Error}}"'))

print("\n=== OOMKilled ===")
print(run('docker inspect virtual-tryon-backend --format "OOMKilled: {{.State.OOMKilled}}"'))

time.sleep(3)

print("\n=== Estado 6s después ===")
print(run('docker ps --filter name=virtual-tryon-backend --format "{{.Names}} {{.Status}}"'))

print("\n=== Logs completos ===")
print(run('docker logs virtual-tryon-backend 2>&1'))

# Ver eventos de Docker para el contenedor
print("\n=== Eventos Docker del backend ===")
print(run('docker events --filter container=virtual-tryon-backend --since 60s --until 0s 2>/dev/null || docker events --filter container=virtual-tryon-backend --since "1m" --format "{{.Time}} {{.Action}}" 2>/dev/null | head -10 || echo "no disponible"'))

client.close()
