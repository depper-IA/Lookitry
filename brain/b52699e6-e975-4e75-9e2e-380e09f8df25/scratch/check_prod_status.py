import paramiko
import os
from dotenv import load_dotenv

load_dotenv('backend/.env')

hostname = os.getenv('VPS_HOST')
port = int(os.getenv('VPS_PORT', 22))
username = os.getenv('VPS_USER')
password = os.getenv('VPS_PASS')

def check_prod_logs():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        client.connect(hostname, port, username, password)
        print(f"Connected to {hostname}")
        
        # Check logs for the backend container
        # We want to see if Redis is connected and if the worker is skipping or processing
        stdin, stdout, stderr = client.exec_command("docker logs --tail 20 root-backend-1")
        logs = stdout.read().decode('utf-8')
        err = stderr.read().decode('utf-8')
        
        print("--- LAST 20 LOG LINES ---")
        print(logs)
        if err:
            print("--- STDERR ---")
            print(err)
            
        # Also check if root-redis-1 is reachable from the backend container
        stdin, stdout, stderr = client.exec_command("docker exec root-backend-1 ping -c 1 root-redis-1")
        ping_res = stdout.read().decode('utf-8')
        print("--- PING REDIS FROM BACKEND ---")
        print(ping_res)

        client.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_prod_logs()
