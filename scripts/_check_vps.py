import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('31.220.18.39', username='root', password='Travis18456916#', timeout=10)

stdin, stdout, stderr = client.exec_command('cat /root/Lookitry/backend/src/controllers/auth-post-payment.controller.ts | grep -n phone')
print(stdout.read().decode())

client.close()
