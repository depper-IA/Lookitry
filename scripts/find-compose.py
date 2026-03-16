import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('31.220.18.39', port=22, username='root', password='Travis18456916#')

print("=== Buscar docker-compose del proyecto ===")
_, stdout, _ = ssh.exec_command('find /root/virtual-tryon -name "docker-compose*" 2>/dev/null')
print(stdout.read().decode())

print("=== Estructura del repo ===")
_, stdout, _ = ssh.exec_command('ls /root/virtual-tryon/')
print(stdout.read().decode())

print("=== .env del backend en VPS ===")
_, stdout, _ = ssh.exec_command('find /root/virtual-tryon -name ".env" 2>/dev/null | head -5')
print(stdout.read().decode())

print("=== Contenedores corriendo ===")
_, stdout, _ = ssh.exec_command('docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"')
print(stdout.read().decode())

ssh.close()
