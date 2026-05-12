import paramiko
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('31.220.18.39', username='root', password='Travis18456916#')

# Get article directly from localhost:3000 inside container
cmd = 'docker exec lookitry-frontend /bin/sh -c "curl -s http://127.0.0.1:3000/blog/prueba-lote-c-el-futuro-de-la-moda-con-ia-en-el-ecommerce"'
stdin, stdout, stderr = client.exec_command(cmd)
data = stdout.read().decode('utf-8', errors='replace')
print(f'Container curl response length: {len(data)}')
print(f'First 300 chars: {data[:300]}')

# Also check if there's any error in logs
stdin2, stdout2, stderr2 = client.exec_command('docker logs lookitry-frontend --tail 30 2>&1')
logs = stdout2.read().decode('utf-8', errors='replace')
print(f'\nFrontend logs:\n{logs[-500:]}')

client.close()