import paramiko
import sys
import base64

def list_users():
    HOST = "31.220.18.39"
    USER = "root"
    PASS = "Travis18456916#"

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, username=USER, password=PASS, timeout=30)
    
    stdin, stdout, stderr = ssh.exec_command("docker ps -a --format '{{.Names}}'")
    backend_name = next((n for n in stdout.read().decode().splitlines() if "backend" in n), None)
    
    if not backend_name: return

    node_script = """
const { createClient } = require('@supabase/supabase-js');
const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function check() {
  const { data, error } = await supabaseAdmin.from('brands').select('email, name, created_at').limit(10).order('created_at', {ascending:false});
  if (error) console.log('ERROR:', error.message);
  else console.log('USERS:', JSON.stringify(data, null, 2));
}
check();
"""
    b64_script = base64.b64encode(node_script.encode()).decode()
    ssh.exec_command(f"echo '{b64_script}' | base64 -d > /tmp/list_users.js")
    ssh.exec_command(f"docker cp /tmp/list_users.js {backend_name}:/app/list_users.js")
    stdin, stdout, stderr = ssh.exec_command(f"docker exec {backend_name} node /app/list_users.js")
    print(stdout.read().decode())
    ssh.close()

if __name__ == "__main__":
    list_users()
