import paramiko

host = '31.220.18.39'
user = 'root'
password = 'Travis18456916#'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect(host, username=user, password=password, timeout=10)
    
    commands = [
        "systemctl list-units | grep pm2",
        "systemctl stop pm2-root",
        "systemctl disable pm2-root",
        "pkill -9 -f 'PM2'",
        "pkill -9 -f 'node /root/virtual-tryon'",
        "pkill -9 -f 'find / -name pm2'",
        "ps -eo pid,cmd,%cpu,%mem --sort=-%cpu | head -10",
        "uptime"
    ]
    
    print("Executing cleanup commands...")
    for cmd in commands:
        stdin, stdout, stderr = client.exec_command(cmd)
        out = stdout.read().decode('utf-8')
        print(f"[{cmd}] ->\n{out}")

except Exception as e:
    print(e)
finally:
    client.close()
