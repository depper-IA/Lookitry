import paramiko
import sys
import base64

def list_admins():
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
  const { data, error } = await supabaseAdmin.from('admins').select('email, role, created_at');
  if (error) console.log('ERROR:', error.message);
  else console.log('ADMINS:', JSON.stringify(data, null, 2));
}
check();
"""
    b64_script = base64.b64encode(node_script.encode()).decode()
    ssh.exec_command(f"echo '{b64_script}' | base64 -d > /tmp/list_admins.js")
    ssh.exec_command(f"docker cp /tmp/list_admins.js {backend_name}:/app/list_admins.js")
    stdin, stdout, stderr = ssh.exec_command(f"docker exec {backend_name} node /app/list_admins.js")
    print(stdout.read().decode())
    ssh.close()

if __name__ == "__main__":
    list_admins()
