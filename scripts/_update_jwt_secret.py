#!/usr/bin/env python3
"""Actualiza JWT_SECRET en el .env del VPS."""
import paramiko

HOST = '31.220.18.39'
USER = 'root'
PASS = 'Travis18456916#'
NEW_JWT = 'PE5uvUMbFsyrxjyL8JPmvxxtcxY9lMDnqePvfy3LRtmDIJIGFvg+N+i6FpVxulVPTYZfvo5rVmzb5V5Y/WWSsA=='
ENV_PATH = '/root/Lookitry/backend/.env'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASS, timeout=15)

# Actualizar JWT_SECRET en el .env del VPS
cmd = f"sed -i 's|^JWT_SECRET=.*|JWT_SECRET={NEW_JWT}|' {ENV_PATH} && grep 'JWT_SECRET' {ENV_PATH}"
stdin, stdout, stderr = client.exec_command(cmd)
out = stdout.read().decode().strip()
err = stderr.read().decode().strip()

if err:
    print(f"Error: {err}")
else:
    preview = out[:60] + '...' if len(out) > 60 else out
    print(f"JWT_SECRET actualizado: {preview}")

client.close()
print("Listo.")
