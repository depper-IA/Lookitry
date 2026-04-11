import paramiko
import os
from dotenv import load_dotenv

load_dotenv('backend/.env')

hostname = os.getenv('VPS_HOST')
port = int(os.getenv('VPS_PORT', 22))
username = os.getenv('VPS_USER')
password = os.getenv('VPS_PASS')

def check_prod_errors():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        client.connect(hostname, port, username, password)
        print(f"Connected to {hostname}")
        
        container_name = "lookitry-backend"
        
        # Search for Redis or Worker errors in the logs
        print("Checking for Redis or Worker errors...")
        stdin, stdout, stderr = client.exec_command(f"docker logs --tail 100 {container_name} 2>&1 | grep -iE 'Redis|Worker'")
        output = stdout.read().decode('utf-8', errors='ignore')
        
        if output:
            print("--- RELEVANT LOGS ---")
            print(output)
        else:
            print("No Redis or Worker errors found in the last 100 lines.")
            
        # Verify Redis host resolution inside container
        stdin, stdout, stderr = client.exec_command(f"docker exec {container_name} getent hosts root-redis-1")
        res = stdout.read().decode('utf-8')
        print("--- REDIS HOST RESOLUTION ---")
        if res:
            print(res)
        else:
            print("Failed to resolve root-redis-1 host.")

        client.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_prod_errors()
