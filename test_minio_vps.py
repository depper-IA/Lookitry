import paramiko
import sys

try:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect('31.220.18.39', username='root', password='Travis18456916#')
    
    print("--- 1. Wget from lookitry-backend ---")
    stdin, stdout, stderr = client.exec_command('docker exec lookitry-backend wget -qS -O /dev/null https://minio.wilkiedevs.com/images/products/1777652410772-ac39db6cbb11.webp')
    print("STDOUT:", stdout.read().decode())
    print("STDERR:", stderr.read().decode())

    print("\n--- 2. Wget from root-n8n-1 ---")
    stdin, stdout, stderr = client.exec_command('docker exec root-n8n-1 wget -qS -O /dev/null https://minio.wilkiedevs.com/images/products/1777652410772-ac39db6cbb11.webp')
    print("STDOUT:", stdout.read().decode())
    print("STDERR:", stderr.read().decode())
    
except Exception as e:
    print(f"Error: {e}")
finally:
    client.close()
