import paramiko
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('31.220.18.39', username='root', password='Travis18456916#')

# Use wget from traefik
stdin, stdout, stderr = client.exec_command('docker exec traefik /bin/sh -c "wget -q -O - http://lookitry-frontend:3000/blog/prueba-lote-c-el-futuro-de-la-moda-con-ia-en-el-ecommerce 2>&1 | wc -c"')
data = stdout.read().decode('utf-8', errors='replace')
print(f'wget response size: {data}')

# Try homepage
stdin2, stdout2, stderr2 = client.exec_command('docker exec traefik /bin/sh -c "wget -q -O - http://lookitry-frontend:3000/ 2>&1 | head -c 500"')
data2 = stdout2.read().decode('utf-8', errors='replace')
print(f'Homepage: {data2[:500]}')

# Check if the error pages container is being served instead
stdin3, stdout3, stderr3 = client.exec_command('docker exec traefik /bin/sh -c "wget -q -O - http://lookitry-frontend:3000/blog/ 2>&1 | head -c 500"')
data3 = stdout3.read().decode('utf-8', errors='replace')
print(f'Blog homepage: {data3[:500]}')

client.close()