import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('31.220.18.39', username='root', password='Travis18456916#')

# Search for CORS_ORIGIN in all .env files
stdin, stdout, stderr = client.exec_command('grep -r "CORS_ORIGIN" /root/virtual-tryon/ 2>/dev/null')
print('CORS_ORIGIN search:', stdout.read().decode() or 'Not found')

# Search for placeholder tu-dominio
stdin, stdout, stderr = client.exec_command('grep -r "tu-dominio" /root/virtual-tryon/ 2>/dev/null')
print('Placeholder search:', stdout.read().decode() or 'No placeholder found')

# Show all .env files
stdin, stdout, stderr = client.exec_command('find /root/virtual-tryon -name "*.env*" -type f 2>/dev/null')
print('Env files found:', stdout.read().decode())

client.close()
