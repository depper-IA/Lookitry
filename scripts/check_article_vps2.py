import paramiko
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('31.220.18.39', username='root', password='Travis18456916#')

# Get article directly from localhost:3000 inside container
cmd = 'docker exec lookitry-frontend /bin/sh -c "curl -s http://127.0.0.1:3000/blog/prueba-lote-c-el-futuro-de-la-moda-con-ia-en-el-ecommerce"'
stdin, stdout, stderr = client.exec_command(cmd)
data = stdout.read().decode('utf-8', errors='replace')
print(f'Container curl response length: {len(data)}')
if data:
    print(f'First 500 chars: {data[:500]}')
else:
    print('EMPTY RESPONSE - checking what the root returns...')
    cmd2 = 'docker exec lookitry-frontend /bin/sh -c "curl -s http://127.0.0.1:3000/"'
    stdin2, stdout2, stderr2 = client.exec_command(cmd2)
    data2 = stdout2.read().decode('utf-8', errors='replace')
    print(f'Root response length: {len(data2)}')
    if data2:
        print(f'Root first 300: {data2[:300]}')

# Check docker-compose for frontend to see port mapping
stdin3, stdout3, stderr3 = client.exec_command('grep -A5 "lookitry-frontend" /root/virtual-tryon/docker-compose.frontend.yml 2>&1')
yml = stdout3.read().decode('utf-8', errors='replace')
print(f'\nDocker compose frontend:\n{yml}')

client.close()
print('\nDone')