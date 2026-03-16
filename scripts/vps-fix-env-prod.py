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

# Ver el .env.production actual
print("=== .env.production actual ===")
print(run('cat /root/virtual-tryon/backend/.env.production 2>/dev/null | grep -v "KEY\|SECRET\|PASS\|TOKEN\|HASH" || echo "no existe"'))

# Ver si tiene SUPABASE_ANON_KEY
print("\n=== Claves Supabase en .env.production ===")
print(run('cat /root/virtual-tryon/backend/.env.production 2>/dev/null | grep -E "^(SUPABASE|JWT_SECRET|NODE_ENV)" | sed "s/=.*/=***/" || echo "no existe"'))

# Escribir el .env.production correcto
env_prod = """PORT=3001
NODE_ENV=production
SUPABASE_URL=https://vkdooutklowctuudjnkl.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrZG9vdXRrbG93Y3R1dWRqbmtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3NjU2NjUsImV4cCI6MjA4NjM0MTY2NX0.ysvYQtcl2hCEOJVczXG-4knzt6oOd74z9iE3Ci_KOWM
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrZG9vdXRrbG93Y3R1dWRqbmtsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDc2NTY2NSwiZXhwIjoyMDg2MzQxNjY1fQ.NxXV0Too3Iadb0FGuC8powPUuaMPiF1TKIUVtGMyFpg
JWT_SECRET=virtual-tryon-saas-secret-key-change-in-production-2026
JWT_EXPIRES_IN=7d
N8N_WEBHOOK_URL=https://n8n.wilkiedevs.com/webhook/tryon
N8N_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NGUxZTYyYi1kY2M0LTRiZGUtOWFjZS02OTBmMjAxMGIyMDAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiZWE2NmI1N2ItNTBiNS00ZTViLWJhYzYtZDE2MWFkM2NkZTkzIiwiaWF0IjoxNzczMjc5MzMyfQ.ZuYsz4K4ifpp9ho_nZzpDypTy49_APNx9hkecKridJw
N8N_TIMEOUT=90000
N8N_BEARER_TOKEN=Travis2305**
N8N_HEADER_NAME=Authorization
OPENROUTER_API_KEY=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
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=info@pruebalo.wilkiedevs.com
SMTP_PASS=Travis2305*
SMTP_FROM=Virtual Try-On SaaS <info@pruebalo.wilkiedevs.com>
FRONTEND_URL=https://pruebalo.wilkiedevs.com
CORS_ORIGIN=https://pruebalo.wilkiedevs.com
WOMPI_PUBLIC_KEY=pub_test_3X84dh5ArV79atO6WwNFznjK3kv45JI2
WOMPI_PRIVATE_KEY=prv_test_ZrBx84WuuB6V7NDPf7Ed9XyRYhg77J1s
WOMPI_EVENTS_SECRET=test_events_ywYgTECX1VdqCmLiGPxeUYXzaJqIAVsg
WOMPI_INTEGRITY_SECRET=test_integrity_9tTBgHdvYU2yPEIapYGbeFvNCqrlfLQG
WOMPI_ENABLED=true
"""

print("\n=== Escribiendo .env.production ===")
result = run("cat > /root/virtual-tryon/backend/.env.production << 'ENVEOF'\n" + env_prod.strip() + "\nENVEOF")
print(result or "ok")

print("\n=== Verificando claves en .env.production ===")
print(run('grep -E "^(SUPABASE|JWT_SECRET|NODE_ENV)" /root/virtual-tryon/backend/.env.production | sed "s/=.*/=***/"'))

# Reiniciar solo el backend (sin rebuild — el código ya está correcto)
print("\n=== Reiniciando backend con nuevo .env.production ===")
print(run('cd /root/virtual-tryon && docker compose -f docker-compose.backend.yml up -d --force-recreate 2>&1', timeout=30))

time.sleep(8)

print("\n=== Estado ===")
print(run('docker ps --filter name=virtual-tryon-backend --format "{{.Names}} {{.Status}}"'))

print("\n=== Logs ===")
print(run('docker logs virtual-tryon-backend --tail 10 2>&1'))

# Test del register
print("\n=== Test register ===")
backend_ip = run('docker inspect virtual-tryon-backend --format "{{range .NetworkSettings.Networks}}{{.IPAddress}} {{end}}"').strip().split()[0]
print(run(f'''curl -s --max-time 15 -X POST http://{backend_ip}:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d \'{{"email":"prodtest@test.com","password":"Test1234!","name":"Prod Test","slug":"prod-test-x1"}}\' ''', timeout=20))

time.sleep(2)
print("\n=== Logs después del register ===")
print(run('docker logs virtual-tryon-backend --tail 15 2>&1'))

client.close()
