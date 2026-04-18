import paramiko

host = '31.220.18.39'
user = 'root'
password = 'Travis18456916#'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect(host, username=user, password=password, timeout=10)
    
    # Check what ports are used
    stdin, stdout, stderr = client.exec_command("netstat -tulpn | grep node")
    print("=== NODE PORTS ===")
    print(stdout.read().decode('utf-8'))
    
    # Try using full path to pm2
    stdin, stdout, stderr = client.exec_command("find / -name pm2 2>/dev/null | grep bin/pm2")
    pm2_paths = stdout.read().decode('utf-8').strip().split('\n')
    print(f"=== PM2 PATHS ===\n{pm2_paths}")
    
    pm2_cmd = pm2_paths[0] if pm2_paths and pm2_paths[0] else "pm2"
    
    # Check PM2 status with full path
    stdin, stdout, stderr = client.exec_command(f"{pm2_cmd} status")
    print("=== PM2 STATUS ===")
    print(stdout.read().decode('utf-8'))
    
    # Kill the rogue node processes if they are just orphans
    stdin, stdout, stderr = client.exec_command(f"{pm2_cmd} stop all && {pm2_cmd} delete all")
    print("=== PM2 STOP ===")
    print(stdout.read().decode('utf-8'))
    print(stderr.read().decode('utf-8'))
    
    # Kill any remaining bare node PM2 instances running from /root/virtual-tryon/backend
    stdin, stdout, stderr = client.exec_command("pkill -f 'node /root/virtual-tryon/backend'")
    
    # Check uptime and load again
    stdin, stdout, stderr = client.exec_command("uptime")
    print("=== FINAL UPTIME ===")
    print(stdout.read().decode('utf-8'))

except Exception as e:
    print(e)
finally:
    client.close()
