import paramiko

try:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect('31.220.18.39', username='root', password='Travis18456916#')
    
    stdin, stdout, stderr = client.exec_command('docker exec lookitry-backend getent hosts wilkiedevs.com')
    print("STDOUT:", stdout.read().decode())
    print("STDERR:", stderr.read().decode())

    stdin, stdout, stderr = client.exec_command('cat /etc/hosts')
    print("\nHOSTS FILE:")
    print(stdout.read().decode())
except Exception as e:
    print(f"Error: {e}")
finally:
    client.close()
