import paramiko
import os

def deploy():
    # SSH credentials from .env
    hostname = "92.112.189.47"
    port = 65002
    username = "u639440667"
    password = "Travis2305*"

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect(hostname, port, username, password)
        sftp = ssh.open_sftp()
        
        # Local paths
        base_dir = r"c:\Users\Matt\Lookitry\lookitry-woocommerce"
        remote_base = "domains/wilkiedevs.com/public_html/wp-content/plugins/lookitry-woocommerce"
        
        # Deploy recursively
        for root, dirs, files in os.walk(base_dir):
            for file in files:
                local_path = os.path.join(root, file)
                rel_path = os.path.relpath(local_path, base_dir)
                remote_path = os.path.join(remote_base, rel_path).replace("\\", "/")
                
                # Ensure remote directory exists
                remote_dir = os.path.dirname(remote_path)
                try:
                    ssh.exec_command(f"mkdir -p {remote_dir}")
                except:
                    pass
                
                print(f"Deploying {rel_path} to {remote_path}")
                sftp.put(local_path, remote_path)
            
        print("Success!")
        sftp.close()
        ssh.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    deploy()
