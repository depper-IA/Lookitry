#!/usr/bin/env python3
import sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
import paramiko

VPS_HOST = "31.220.18.39"
VPS_USER = "root"
VPS_PASS = "Travis18456916#"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(VPS_HOST, username=VPS_USER, password=VPS_PASS, timeout=15)
print("[OK] Connected")

print("=> Executing n8n CLI to activate workflow (with long timeout)")
stdin, stdout, stderr = client.exec_command("docker exec root-n8n-1 n8n update:workflow --id=wPLypk7KhBcFLicX --active=true", timeout=120)
print(stdout.read().decode("utf-8", errors="replace"))
print("ERROR OUTPUT:", stderr.read().decode("utf-8", errors="replace"))

client.close()
