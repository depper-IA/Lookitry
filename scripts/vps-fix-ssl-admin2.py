import paramiko, time, json

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

# ============================================================
# PARTE 1: SSL — ver el acme.json para entender qué certificados tiene Traefik
# ============================================================
acme_path = run('docker volume inspect traefik_data --format "{{.Mountpoint}}"')
print(f"=== Ruta acme.json: {acme_path} ===")
print(run(f'ls -la {acme_path}/'))

# Ver qué dominios tiene el acme.json
print("\n=== Dominios en acme.json ===")
print(run(f'cat {acme_path}/acme.json 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); certs=d.get(\'mytlschallenge\',{{}}).get(\'Certificates\',[]) or []; [print(c.get(\'domain\',{{}}).get(\'main\',\'?\')) for c in certs]" 2>/dev/null || echo "acme.json vacio o no existe"'))

# El problema: borramos el acme.json antes y Traefik no puede renovar por rate limit
# Solución: restaurar el certificado existente en el acme.json
# El cert de pruebalo.wilkiedevs.com existe (openssl lo confirmó) — debe estar en otro lugar

# Ver si hay certificados en otro volumen o directorio
print("\n=== Buscar certificados en el sistema ===")
print(run('ls /etc/letsencrypt/live/ 2>/dev/null || echo "no hay certbot"'))
print(run('docker exec root-traefik-1 ls /letsencrypt/ 2>/dev/null'))

# Ver el acme.json dentro del contenedor de Traefik
print("\n=== acme.json dentro de Traefik ===")
print(run('docker exec root-traefik-1 cat /letsencrypt/acme.json 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); certs=d.get(\'mytlschallenge\',{{}}).get(\'Certificates\',[]) or []; [print(c.get(\'domain\',{{}}).get(\'main\',\'?\')) for c in certs]" 2>/dev/null || echo "vacio"'))

# ============================================================
# PARTE 2: Crear el admin en Supabase directamente via API REST
# ============================================================
SUPABASE_URL = "https://vkdooutklowctuudjnkl.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrZG9vdXRrbG93Y3R1dWRqbmtsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDc2NTY2NSwiZXhwIjoyMDg2MzQxNjY1fQ.NxXV0Too3Iadb0FGuC8powPUuaMPiF1TKIUVtGMyFpg"

print("\n=== Verificar tabla admins en Supabase ===")
print(run(f'''curl -s "{SUPABASE_URL}/rest/v1/admins?select=id,email,name,role&limit=5" \
  -H "apikey: {SERVICE_KEY}" \
  -H "Authorization: Bearer {SERVICE_KEY}" '''))

# Crear el admin usando el script del backend
print("\n=== Ejecutar create-admin en el contenedor ===")
print(run('docker exec virtual-tryon-backend node -e "\
const bcrypt = require(\'bcryptjs\');\
const { createClient } = require(\'@supabase/supabase-js\');\
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);\
bcrypt.hash(\'Travis2305*\', 10).then(hash => {\
  return supabase.from(\'admins\').upsert([{email:\'info.samwilkie@gmail.com\',password:hash,name:\'Sam Wilkie\',role:\'super_admin\'}],{onConflict:\'email\'}).select().single();\
}).then(({data,error}) => {\
  if(error) console.log(\'ERROR:\',error.message);\
  else console.log(\'OK:\',data.email,data.role);\
}).catch(e => console.log(\'CATCH:\',e.message));\
" 2>&1', timeout=15))

client.close()
