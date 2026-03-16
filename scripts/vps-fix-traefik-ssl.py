import paramiko, time, json

HOST = '31.220.18.39'
PORT = 22
USER = 'root'
PASS = 'Travis18456916#'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, port=PORT, username=USER, password=PASS, timeout=15)

def run(cmd, timeout=60):
    _, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    return out + ('\n[STDERR]: ' + err if err else '')

# ============================================================
# PROBLEMA: Traefik redirige HTTP→HTTPS globalmente, lo que
# impide que el httpChallenge de ACME funcione (el challenge
# llega por HTTP pero es redirigido a HTTPS → 404).
#
# SOLUCIÓN: Modificar docker-compose.yml para que la
# redirección HTTP→HTTPS sea por router (no global), así
# Traefik puede responder al challenge en HTTP.
# ============================================================

print("=== Leyendo docker-compose.yml actual ===")
current = run('cat /root/docker-compose.yml')
print(current[:500] + "...")

# Verificar si ya tiene la redirección global
print("\n=== Verificando configuración actual ===")
print(run('grep -n "redirections\|httpchallenge\|entrypoint" /root/docker-compose.yml'))

# La solución: quitar la redirección global de entrypoints.web
# y agregar un middleware de redirección en cada router que lo necesite
# Pero eso requiere modificar todos los routers...
#
# Alternativa más simple: usar tlsChallenge en lugar de httpChallenge
# tlsChallenge usa el puerto 443 directamente, no necesita HTTP
# PERO: ya tenemos rate limit con el dominio...
#
# La solución REAL más simple: 
# Agregar una excepción en la redirección para que NO redirija
# cuando el path es /.well-known/acme-challenge
# Esto se hace con un middleware de regex en Traefik

# Verificar el docker-compose.yml completo para entender la estructura
print("\n=== docker-compose.yml completo ===")
print(run('cat /root/docker-compose.yml'))

client.close()
