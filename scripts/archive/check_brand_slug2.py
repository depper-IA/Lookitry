import paramiko
import re

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('31.220.18.39', 22, 'root', 'Travis18456916#')

# Get SUPABASE_URL and SUPABASE_SERVICE_KEY from backend env
stdin, stdout, stderr = ssh.exec_command('cat /root/virtual-tryon/backend/.env.production')
env_content = stdout.read().decode('utf-8')

sb_url = re.search(r'SUPABASE_URL=(.+)', env_content).group(1).strip()
sb_key = re.search(r'SUPABASE_SERVICE_KEY=(.+)', env_content).group(1).strip()

# Query Supabase via curl
curl_cmd = f"curl -s '{sb_url}/rest/v1/brands?select=slug,name&name=ilike.*wilkie*' -H 'apikey: {sb_key}' -H 'Authorization: Bearer {sb_key}'"
stdin, stdout, stderr = ssh.exec_command(curl_cmd)
print("=== DB QUERY RESULTS ===")
print(stdout.read().decode('utf-8'))

# Check exact match for 'wilkie-devs'
curl_cmd2 = f"curl -s '{sb_url}/rest/v1/brands?select=slug,name&slug=eq.wilkie-devs' -H 'apikey: {sb_key}' -H 'Authorization: Bearer {sb_key}'"
stdin, stdout, stderr = ssh.exec_command(curl_cmd2)
print("\n=== EXACT MATCH 'wilkie-devs' ===")
print(stdout.read().decode('utf-8'))

ssh.close()