import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('31.220.18.39', 22, 'root', 'Travis18456916#')

# Buscar errores relacionados con imgProxy o imágenes en los últimos logs
stdin, stdout, stderr = ssh.exec_command('docker logs lookitry-backend --tail 500 2>&1 | grep -i -E "imgProxy|img-proxy|image|error"')
output = stdout.read().decode('utf-8', errors='replace')
print("=== LOGS DE IMÁGENES ===")
print(output[-2000:] if len(output) > 2000 else output)

ssh.close()