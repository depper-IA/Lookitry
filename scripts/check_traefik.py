import paramiko
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('31.220.18.39', username='root', password='Travis18456916#')

# Check traefik logs
stdin, stdout, stderr = client.exec_command('docker logs traefik --tail 30 2>&1')
logs = stdout.read().decode('utf-8', errors='replace')
print(f'Traefik logs (last 30):\n{logs}')

# Check if there's an error page being served
stdin2, stdout2, stderr2 = client.exec_command('curl -s http://lookitry.com/blog/prueba-lote-c-el-futuro-de-la-moda-con-ia-en-el-ecommerce 2>&1 | wc -c')
r = stdout2.read().decode('utf-8', errors='replace')
print(f'\ncurl from traefik network: {r}')

# Check the actual traefik config
stdin3, stdout3, stderr3 = client.exec_command('cat /root/virtual-tryon/traefik.yml 2>&1')
cfg = stdout3.read().decode('utf-8', errors='replace')
print(f'\nTraefik config:\n{cfg[:2000]}')

client.close()
print('\nDone')