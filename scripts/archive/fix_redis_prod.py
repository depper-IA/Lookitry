import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('31.220.18.39', 22, 'root', 'Travis18456916#')

# Fix REDIS_URL in .env.production - remove password
cmd = "sed -i 's|REDIS_URL=redis://default:Redis2024SecurePassNoSlash@root-redis-1:6379|REDIS_URL=redis://root-redis-1:6379|g' /root/virtual-tryon/backend/.env.production"
stdin, stdout, stderr = ssh.exec_command(cmd)
print("Updated REDIS_URL")

# Also remove REDIS_PASSWORD line if not needed
cmd2 = "sed -i '/^REDIS_PASSWORD=/d' /root/virtual-tryon/backend/.env.production"
ssh.exec_command(cmd2)

# Verify
stdin, stdout, stderr = ssh.exec_command('cat /root/virtual-tryon/backend/.env.production | grep -i redis')
print("\n=== After fix ===")
print(stdout.read().decode('utf-8', errors='replace'))

# Restart backend
print("\nRestarting backend...")
ssh.exec_command('cd /root/virtual-tryon && docker compose -f docker-compose.backend.yml restart')

ssh.close()
print("Done!")