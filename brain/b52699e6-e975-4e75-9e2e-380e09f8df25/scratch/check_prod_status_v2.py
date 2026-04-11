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
        
        container_name = "lookitry-backend"
        
        # Check logs for the backend container
        stdin, stdout, stderr = client.exec_command(f"docker logs --tail 50 {container_name}")
        logs = stdout.read().decode('utf-8')
        err = stderr.read().decode('utf-8')
        
        print(f"--- LAST 50 LOG LINES FROM {container_name} ---")
        print(logs)
        if err:
            print("--- STDERR ---")
            print(err)
            
        # Check if root-redis-1 is reachable from the backend container
        stdin, stdout, stderr = client.exec_command(f"docker exec {container_name} ping -c 1 root-redis-1")
        ping_res = stdout.read().decode('utf-8')
        print("--- PING REDIS FROM BACKEND ---")
        if ping_res:
            print(ping_res)
        else:
            print("Ping failed or no output.")

        client.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_prod_logs()
