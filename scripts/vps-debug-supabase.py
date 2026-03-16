import paramiko, time

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

# Verificar que las variables están dentro del contenedor
print("=== Variables Supabase dentro del contenedor ===")
print(run('docker exec virtual-tryon-backend env | grep -E "SUPABASE|JWT" | sed "s/=.*/=***/"'))

# Test directo de Supabase desde dentro del contenedor con las claves
print("\n=== Test Supabase REST desde el contenedor ===")
anon_key = run('docker exec virtual-tryon-backend env | grep SUPABASE_ANON_KEY | cut -d= -f2')
supabase_url = run('docker exec virtual-tryon-backend env | grep SUPABASE_URL | cut -d= -f2')

# Hacer una query simple a Supabase desde dentro del contenedor
print(run(f'''docker exec virtual-tryon-backend sh -c 'wget -qO- --timeout=10 \
  --header="apikey: {anon_key}" \
  --header="Authorization: Bearer {anon_key}" \
  "{supabase_url}/rest/v1/brands?select=id&limit=1" 2>&1' '''))

# Ver si el contenedor tiene acceso a internet
print("\n=== Acceso a internet desde el contenedor ===")
print(run('docker exec virtual-tryon-backend sh -c "wget -qO- --timeout=5 https://httpbin.org/ip 2>&1 | head -5"'))

# Hacer el request y ver los logs en tiempo real
print("\n=== Iniciando seguimiento de logs ===")
# Lanzar el request en background y capturar logs
run('docker exec virtual-tryon-backend sh -c "wget -qO- --timeout=15 --post-data=\'{\"email\":\"logtest@test.com\",\"password\":\"Test1234!\",\"name\":\"Log Test\",\"slug\":\"log-test-x\"}\' --header=\'Content-Type: application/json\' http://localhost:3001/api/auth/register > /tmp/register_result.txt 2>&1 &"')

time.sleep(3)
print("Logs del backend (3s después del request):")
print(run('docker logs virtual-tryon-backend --since 10s 2>&1'))

time.sleep(5)
print("\nLogs del backend (8s después del request):")
print(run('docker logs virtual-tryon-backend --since 15s 2>&1'))

print("\nResultado del request:")
print(run('docker exec virtual-tryon-backend cat /tmp/register_result.txt 2>/dev/null || echo "sin resultado aun"'))

client.close()
