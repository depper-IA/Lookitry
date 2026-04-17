#!/usr/bin/env python3
"""Quick check - is n8n container running properly after restart?"""
import sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

import paramiko

VPS_HOST = "31.220.18.39"
VPS_USER = "root"
VPS_PASS = "Travis18456916#"

def run(client, cmd, timeout=30):
    print(f"\n$ {cmd[:120]}")
    sys.stdout.flush()
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode("utf-8", errors="replace")
    err = stderr.read().decode("utf-8", errors="replace")
    if out: print(out.rstrip())
    if err and err.strip(): print("[ERR]", err.rstrip()[:400])
    sys.stdout.flush()
    return out

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(VPS_HOST, username=VPS_USER, password=VPS_PASS, timeout=15)
print("[OK] Connected")

# Ver estado actual
run(client, "docker ps --filter name=n8n --format 'table {{.Names}}\\t{{.Status}}\\t{{.Ports}}'")
run(client, "docker logs root-n8n-1 --tail 20 2>&1")

# Test health
n8n_ip_out = run(client, "docker inspect root-n8n-1 --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'")
n8n_ip = n8n_ip_out.strip()
print(f"\n[*] n8n IP: {n8n_ip}")
run(client, f"curl -s http://{n8n_ip}:5678/healthz --max-time 5 || echo 'NO RESPONSE'")

client.close()
