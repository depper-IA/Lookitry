import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

password = 'Travis18456916#'
client.connect('31.220.18.39', username='root', password=password)

# Update N8N_WEBHOOK_URL
cmd1 = "sed -i 's|N8N_WEBHOOK_URL=.*|N8N_WEBHOOK_URL=https://n8n.wilkiedevs.com/webhook/tryon|' /root/virtual-tryon/backend/.env.production"
stdin, stdout, stderr = client.exec_command(cmd1)
result1 = stdout.read().decode() + stderr.read().decode()
print(f'N8N_WEBHOOK_URL: {result1 or "OK"}')

# Update CORS_ORIGIN
cmd2 = "sed -i 's|CORS_ORIGIN=.*|CORS_ORIGIN=https://lookitry.com,https://www.lookitry.com,https://wilkie-devs.com,https://www.wilkie-devs.com|' /root/virtual-tryon/backend/.env.production"
stdin, stdout, stderr = client.exec_command(cmd2)
result2 = stdout.read().decode() + stderr.read().decode()
print(f'CORS_ORIGIN: {result2 or "OK"}')

# Verify changes
stdin, stdout, stderr = client.exec_command("grep -E '^(N8N_WEBHOOK_URL|CORS_ORIGIN)=' /root/virtual-tryon/backend/.env.production")
print('\\nVerification:')
print(stdout.read().decode())

# Restart backend
stdin, stdout, stderr = client.exec_command("docker restart lookitry-backend")
print('\\nBackend restart:', stdout.read().decode() or 'OK')

client.close()
print('SSH connection closed')
