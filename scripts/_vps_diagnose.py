import paramiko
import sys

host = '31.220.18.39'
user = 'root'
password = 'Travis18456916#'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    print(f"Connecting to {host}...")
    client.connect(host, username=user, password=password, timeout=10)
    print("Connected successfully.\n")

    commands = [
        ("=== UPTIME & LOAD ===", "uptime"),
        ("=== MEMORY ===", "free -m"),
        ("=== DISK ===", "df -h /"),
        ("=== TOP 10 PROCESSES BY CPU ===", "ps -eo pid,ppid,cmd,%mem,%cpu --sort=-%cpu | head -11"),
        ("=== TOP 10 PROCESSES BY MEMORY ===", "ps -eo pid,ppid,cmd,%mem,%cpu --sort=-%mem | head -11"),
        ("=== PM2 STATUS ===", "pm2 status"),
        ("=== DOCKER CONTAINERS ===", "docker ps -a --format 'table {{.Names}}\t{{.Status}}\t{{.RunningFor}}'"),
        ("=== DOCKER STATS ===", "docker stats --no-stream --format 'table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}'"),
    ]

    for title, cmd in commands:
        print(title)
        stdin, stdout, stderr = client.exec_command(cmd, timeout=15)
        out = stdout.read().decode('utf-8')
        err = stderr.read().decode('utf-8')
        if out:
            print(out)
        if err:
            print(f"[STDERR]\n{err}")
        print("-" * 50)

except Exception as e:
    print(f"Error: {e}")
finally:
    client.close()
