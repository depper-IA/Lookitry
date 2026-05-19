import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('31.220.18.39', username='root', password='Travis18456916#')

stdin, stdout, stderr = client.exec_command('docker exec lookitry-frontend cat .next/server/app/api/img-proxy/route.js')
content = stdout.read().decode()
with open('route_deployed.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("File saved to route_deployed.js")

client.close()