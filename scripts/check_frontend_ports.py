import paramiko
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('31.220.18.39', username='root', password='Travis18456916#')

# Check what process is running in container and what port
cmd = 'docker exec lookitry-frontend /bin/sh -c "netstat -tlnp 2>/dev/null || ss -tlnp 2>/dev/null || cat /proc/net/tcp 2>/dev/null | head -20"'
stdin, stdout, stderr = client.exec_command(cmd)
data = stdout.read().decode('utf-8', errors='replace')
print(f'Ports in container:\n{data[:1000]}')

# Check if next is running
cmd2 = 'docker exec lookitry-frontend /bin/sh -c "ps aux | grep -E \\"next|node\\" | grep -v grep"'
stdin2, stdout2, stderr2 = client.exec_command(cmd2)
data2 = stdout2.read().decode('utf-8', errors='replace')
print(f'\nProcesses:\n{data2[:500]}')

# Check the traefik config for frontend
cmd3 = 'grep -A20 "lookitry-frontend" /root/virtual-tryon/docker-compose.yml 2>/dev/null || grep -A20 "frontend" /root/virtual-tryon/traefik.yml 2>/dev/null'
stdin3, stdout3, stderr3 = client.exec_command(cmd3)
data3 = stdout3.read().decode('utf-8', errors='replace')
print(f'\nTraefik config for frontend:\n{data3[:1000]}')

client.close()
print('\nDone')