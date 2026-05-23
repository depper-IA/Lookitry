import paramiko
import sys

try:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect('31.220.18.39', username='root', password='Travis18456916#')
    
    print("--- Setting MinIO Bucket Policy to Public ---")
    commands = [
        "docker exec lookitry-minio-server mc alias set myminio http://localhost:9000 Wilkiedevs 'Travis2305*'",
        "docker exec lookitry-minio-server mc anonymous set download myminio/images"
    ]
    
    for cmd in commands:
        print(f"Executing: {cmd}")
        stdin, stdout, stderr = client.exec_command(cmd)
        print("STDOUT:", stdout.read().decode().strip())
        print("STDERR:", stderr.read().decode().strip())
        print()
        
    print("--- Re-testing cURL ---")
    stdin, stdout, stderr = client.exec_command('docker exec root-n8n-1 wget -qS -O /dev/null https://minio.wilkiedevs.com/images/products/1777652410772-ac39db6cbb11.webp')
    print("STDOUT:", stdout.read().decode())
    print("STDERR:", stderr.read().decode())

except Exception as e:
    print(f"Error: {e}")
finally:
    client.close()
