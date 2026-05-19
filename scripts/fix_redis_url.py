import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('31.220.18.39', 22, 'root', 'Travis18456916#')

# Update REDIS_URL in backend .env to not have password
stdin, stdout, stderr = ssh.exec_command('docker exec lookitry-backend sh -c "echo \\$REDIS_URL"')
print("CURRENT REDIS_URL:", stdout.read().decode('utf-8', errors='replace').strip())

# Update the .env file to remove password
stdin, stdout, stderr = ssh.exec_command('sed -i \'s|redis://default:Redis2024SecurePassNoSlash@root-redis-1:6379|redis://root-redis-1:6379|g\' /root/virtual-tryon/.env')
print("\nUpdated .env")

# Also check and update docker-compose env if needed
stdin, stdout, stderr = ssh.exec_command('grep REDIS /root/virtual-tryon/.env')
print("\nREDIS in .env:", stdout.read().decode('utf-8', errors='replace').strip())

ssh.close()