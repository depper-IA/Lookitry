import paramiko
import os
from dotenv import load_dotenv

load_dotenv('backend/.env')

hostname = os.getenv('VPS_HOST')
port = int(os.getenv('VPS_PORT', 22))
username = os.getenv('VPS_USER')
password = os.getenv('VPS_PASS')

def list_containers():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        client.connect(hostname, port, username, password)
        print(f"Connected to {hostname}")
        
        stdin, stdout, stderr = client.exec_command("docker ps --format '{{.Names}}'")
        containers = stdout.read().decode('utf-8')
        print("--- RUNNING CONTAINERS ---")
        print(containers)

        client.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    list_containers()
