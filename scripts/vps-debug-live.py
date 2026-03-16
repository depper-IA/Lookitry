import paramiko, time, threading

HOST = '31.220.18.39'
PORT = 22
USER = 'root'
PASS = 'Travis18456916#'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, port=PORT, username=USER, password=PASS, timeout=15)

def run(cmd, timeout=30):
    _, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    return out + ('\n[STDERR]: ' + err if err else '')

# Lanzar el request y capturar logs del backend en el mismo script bash
print("=== Test completo con logs en tiempo real ===")
result = run(r"""
bash -c '
# Lanzar el request en background
curl -s --max-time 12 -X POST http://172.19.0.7:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"livetest@test.com\",\"password\":\"Test1234!\",\"name\":\"Live Test\",\"slug\":\"live-test-x1\"}" \
  > /tmp/reg_out.txt 2>&1 &
REQ_PID=$!

# Capturar logs mientras el request corre
sleep 2
echo "=== LOGS 2s ==="
docker logs virtual-tryon-backend --since 5s 2>&1

sleep 5
echo "=== LOGS 7s ==="
docker logs virtual-tryon-backend --since 10s 2>&1

# Esperar el request
wait $REQ_PID
echo "=== RESULTADO REQUEST ==="
cat /tmp/reg_out.txt

echo "=== LOGS FINALES ==="
docker logs virtual-tryon-backend --since 15s 2>&1
'
""", timeout=25)
print(result)

# Ver si el contenedor sigue vivo
print("\n=== Estado del contenedor ===")
print(run('docker ps --filter name=virtual-tryon-backend --format "{{.Names}} {{.Status}}"'))

# Ver todos los logs recientes incluyendo crashes
print("\n=== Todos los logs recientes del backend ===")
print(run('docker logs virtual-tryon-backend --tail 30 2>&1'))

client.close()
