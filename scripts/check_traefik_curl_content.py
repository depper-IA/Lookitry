import paramiko
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('31.220.18.39', username='root', password='Travis18456916#')

# Get the actual content from traefik's curl
stdin, stdout, stderr = client.exec_command('docker exec traefik /bin/sh -c "curl -s -m 5 http://lookitry-frontend:3000/blog/prueba-lote-c-el-futuro-de-la-moda-con-ia-en-el-ecommerce 2>&1"')
data = stdout.read().decode('utf-8', errors='replace')
print(f'Content ({len(data)} bytes):')
print(repr(data[:500]))

# Try different approach - check if it's a redirect or something
stdin2, stdout2, stderr2 = client.exec_command('docker exec traefik /bin/sh -c "curl -v -m 5 http://lookitry-frontend:3000/blog/prueba-lote-c-el-futuro-de-la-moda-con-ia-en-el-ecommerce 2>&1"')
data2 = stdout2.read().decode('utf-8', errors='replace')
print(f'\nVerbose curl ({len(data2)} bytes):')
print(data2[:1000])

client.close()