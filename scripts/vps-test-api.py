import paramiko

HOST = '31.220.18.39'
PORT = 22
USER = 'root'
PASS = 'Travis18456916#'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, port=PORT, username=USER, password=PASS, timeout=15)

def run(cmd, timeout=20):
    _, stdout, _ = client.exec_command(cmd, timeout=timeout)
    return stdout.read().decode().strip()

# Test desde fuera usando curl con verbose para ver qué pasa
print("=== Health via HTTPS ===")
print(run('curl -v https://api.pruebalo.wilkiedevs.com/health 2>&1 | tail -20'))

print("\n=== Registro via HTTPS ===")
print(run('''curl -s -X POST https://api.pruebalo.wilkiedevs.com/api/auth/register \
  -H "Content-Type: application/json" \
  -H "Origin: https://pruebalo.wilkiedevs.com" \
  -d \'{"email":"prueba@test.com","password":"test1234","name":"Marca Test","slug":"marca-test"}\' '''))

print("\n=== Certificado SSL del backend ===")
print(run('echo | openssl s_client -connect api.pruebalo.wilkiedevs.com:443 -servername api.pruebalo.wilkiedevs.com 2>/dev/null | openssl x509 -noout -dates -subject 2>/dev/null || echo "sin certificado aun"'))

print("\n=== SSL del frontend ===")
print(run('echo | openssl s_client -connect pruebalo.wilkiedevs.com:443 -servername pruebalo.wilkiedevs.com 2>/dev/null | openssl x509 -noout -dates -subject 2>/dev/null || echo "sin certificado aun"'))

client.close()
