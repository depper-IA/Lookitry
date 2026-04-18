import paramiko
import sys

host = '31.220.18.39'
user = 'root'
password = 'Travis18456916#'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect(host, username=user, password=password, timeout=10)
    print("Connected.")
    
    # Run a shell command to kill PM2 and its child processes
    commands = """
    # Find PM2 and stop all
    PM2_PATH=$(find / -name pm2 -type f 2>/dev/null | grep bin/pm2 | head -1)
    if [ ! -z "$PM2_PATH" ]; then
        $PM2_PATH stop all
        $PM2_PATH delete all
        $PM2_PATH save --force
        $PM2_PATH kill
    fi
    # Also nuke anything named PM2
    pkill -9 -f PM2
    
    # Nuke stray node backend processes just in case
    pkill -9 -f "/root/virtual-tryon/backend"
    """
    client.exec_command(commands)
    
    # Check processes after
    stdin, stdout, stderr = client.exec_command("ps -eo pid,cmd,%cpu,%mem --sort=-%cpu | head -10")
    print("--- AFTER ---\n" + stdout.read().decode('utf-8'))
    
    # Check uptime and load
    stdin, stdout, stderr = client.exec_command("uptime")
    print("===\n" + stdout.read().decode('utf-8'))

except Exception as e:
    print(e)
finally:
    client.close()
