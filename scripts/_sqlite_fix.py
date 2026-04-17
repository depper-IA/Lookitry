#!/usr/bin/env python3
import sys
import paramiko
import time

VPS_HOST = "31.220.18.39"
VPS_USER = "root"
VPS_PASS = "Travis18456916#"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(VPS_HOST, username=VPS_USER, password=VPS_PASS, timeout=15)

# Wait for container stop
client.exec_command("docker stop root-n8n-1")
time.sleep(3)

print("\n--- Listing SQLite tables ---")
cmd_tables = """docker run --rm -v root_n8n_data:/data alpine sh -c "apk add --no-cache sqlite && sqlite3 /data/database.sqlite '.tables'" """
stdin, stdout, stderr = client.exec_command(cmd_tables, timeout=60)
tables = stdout.read().decode("utf-8", errors="replace")
print("TABLES:", tables)

print("\n--- Finding workflow wPLypk7KhBcFLicX ---")
cmd_find = """docker run --rm -v root_n8n_data:/data alpine sh -c "apk add --no-cache sqlite && sqlite3 /data/database.sqlite \\"SELECT id, name, active FROM workflow_entity WHERE id='wPLypk7KhBcFLicX';\\"" """
stdin, stdout, stderr = client.exec_command(cmd_find, timeout=60)
print("FIND OUT:", stdout.read().decode("utf-8", errors="replace"))

client.exec_command("docker start root-n8n-1")
client.close()
