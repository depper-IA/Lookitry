#!/usr/bin/env python3
"""Ver el error completo del build del backend."""
import paramiko

HOST = '31.220.18.39'
USER = 'root'
PASS = 'Travis18456916#'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASS, timeout=15)

cmd = "cd /root/Lookitry && docker compose -f docker-compose.backend.yml build --no-cache 2>&1 | grep -A 5 'error TS\\|Error\\|failed'"
stdin, stdout, stderr = client.exec_command(cmd, timeout=180)
out = stdout.read().decode(errors='replace')
err = stderr.read().decode(errors='replace')
print(out[:3000])
if err:
    print("STDERR:", err[:500])
client.close()
