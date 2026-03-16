import paramiko, time

# Conectar al servidor de hosting compartido de Hostinger
# El username es u639440667
# El servidor puede ser accesible via SSH en puerto 65002

def try_connect(host, port, user, password):
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        client.connect(host, port=port, username=user, password=password, timeout=10)
        return client
    except Exception as e:
        print(f"  Fallo {host}:{port} - {e}")
        return None

def run(client, cmd, timeout=15):
    _, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    return out + ('\n[STDERR]: ' + err if err else '')

# Intentar conectar al hosting compartido
# Hostinger usa puerto 65002 para SSH en hosting compartido
hosts_to_try = [
    ('srv1.wilkiedevs.com', 65002),
    ('92.112.189.47', 65002),
    ('92.112.189.47', 22),
]

password = 'Travis18456916#'  # Puede ser diferente para el hosting compartido
user = 'u639440667'

client = None
for host, port in hosts_to_try:
    print(f"Intentando {host}:{port}...")
    client = try_connect(host, port, user, password)
    if client:
        print(f"Conectado a {host}:{port}")
        break

if not client:
    print("\nNo se pudo conectar al hosting compartido via SSH")
    print("Necesitamos eliminar el sitio via hPanel o API de Hostinger")
else:
    print("\n=== Conectado al hosting compartido ===")
    print(run(client, 'whoami'))
    print(run(client, 'ls /home/u639440667/domains/wilkiedevs.com/public_html/'))
    
    # Verificar el directorio del subdominio
    print("\n=== Directorio del subdominio pruebalo ===")
    print(run(client, 'ls /home/u639440667/domains/wilkiedevs.com/public_html/mostrario/ 2>/dev/null | head -10'))
    
    client.close()
