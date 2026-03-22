import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    ssh.connect('31.220.18.39', username='root', password='Travis18456916#', timeout=15)
    print("Conectado.")
    
    stdin, stdout, stderr = ssh.exec_command('docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Image}}"')
    print("\n--- DOCKER PS ---")
    print(stdout.read().decode())
    
    stdin, stdout, stderr = ssh.exec_command('docker logs virtual-tryon-backend --tail 50')
    print("\n--- BACKEND LOGS ---")
    print(stdout.read().decode())
    print(stderr.read().decode())

    ssh.close()
except Exception as e:
    print(f"Error: {e}")
