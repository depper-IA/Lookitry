import paramiko
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('31.220.18.39', username='root', password='Travis18456916#')

# Try curl with timeout
cmd = 'docker exec lookitry-frontend /bin/sh -c "curl -s -m 5 http://127.0.0.1:3000/blog/prueba-lote-c-el-futuro-de-la-moda-con-ia-en-el-ecommerce 2>&1"'
stdin, stdout, stderr = client.exec_command(cmd)
data = stdout.read().decode('utf-8', errors='replace')
err = stderr.read().decode('utf-8', errors='replace')
print(f'Response length: {len(data)}')
print(f'Error: {err[:500]}')
if data:
    print(f'Data: {data[:500]}')

# Try fetching just the homepage
cmd2 = 'docker exec lookitry-frontend /bin/sh -c "curl -s -m 5 http://127.0.0.1:3000/blog/ 2>&1"'
stdin2, stdout2, stderr2 = client.exec_command(cmd2)
data2 = stdout2.read().decode('utf-8', errors='replace')
print(f'\nBlog homepage length: {len(data2)}')
if data2:
    print(f'Data: {data2[:500]}')
else:
    print('EMPTY')

client.close()
print('\nDone')