import paramiko
import os
import sys
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '../backend/.env'))

HOST = os.getenv("VPS_HOST", "31.220.18.39")
USER = os.getenv("VPS_USER", "root")
PASS = os.getenv("VPS_PASS")

def run(ssh, cmd):
    print(f"\n$ {cmd}")
    _, stdout, stderr = ssh.exec_command(cmd, timeout=30)
    out = stdout.read().decode(errors="replace")
    if out.strip(): print(out.strip())
    return out

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    ssh.connect(HOST, username=USER, password=PASS, timeout=10)
    
    print("\n--- TEST: PUBLIC INTERNET ---")
    run(ssh, "curl -s -I https://lookitry.com/pruebalo/wilkie-devs")

    print("\n--- TEST: TRAEFIK LOCAL ---")
    run(ssh, "curl -s -k -I -H 'Host: lookitry.com' https://localhost/pruebalo/wilkie-devs")

    print("\n--- TEST: NEXT.JS LOCAL ---")
    container_ip = run(ssh, "docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' lookitry-frontend").strip()
    if container_ip:
        run(ssh, f"curl -s -I http://{container_ip}:3000/pruebalo/wilkie-devs")

except Exception as e:
    print(f"Error: {e}")
finally:
    ssh.close()
