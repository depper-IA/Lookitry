import paramiko
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('31.220.18.39', username='root', password='Travis18456916#')

# Check running containers
stdin, stdout, stderr = client.exec_command('docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Image}}"')
print("=== CONTAINERS ===")
print(stdout.read().decode('utf-8', errors='replace'))

# Check frontend container logs for errors
stdin, stdout, stderr = client.exec_command('docker logs lookitry-frontend --tail 20 2>&1')
print("=== FRONTEND LOGS ===")
print(stdout.read().decode('utf-8', errors='replace'))

# Check if there's a cached version issue
stdin, stdout, stderr = client.exec_command('docker exec lookitry-frontend ls -la /app/.next/ 2>&1 | head -20')
print("=== NEXT.js CACHE ===")
print(stdout.read().decode('utf-8', errors='replace'))

client.close()
print("Done")