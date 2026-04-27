import paramiko
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('31.220.18.39', username='root', password='Travis18456916#')

# Check traefik container network and connectivity
stdin, stdout, stderr = client.exec_command('docker inspect lookitry-frontend --format "{{json .NetworkSettings.Networks}}" 2>&1')
net = stdout.read().decode('utf-8', errors='replace')
print(f'Frontend networks: {net}')

# Try curl from traefik container to frontend
stdin2, stdout2, stderr2 = client.exec_command('docker exec traefik /bin/sh -c "curl -s -m 5 http://lookitry-frontend:3000/blog/prueba-lote-c-el-futuro-de-la-moda-con-ia-en-el-ecommerce 2>&1 | wc -c"')
r = stdout2.read().decode('utf-8', errors='replace')
print(f'\nTraefik -> Frontend curl: {r}')

# Check if traefik can reach frontend
stdin3, stdout3, stderr3 = client.exec_command('docker exec traefik /bin/sh -c "ping -c 1 lookitry-frontend 2>&1"')
p = stdout3.read().decode('utf-8', errors='replace')
print(f'\nPing result: {p}')

client.close()
print('\nDone')