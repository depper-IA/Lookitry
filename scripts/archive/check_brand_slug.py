import paramiko
import json

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('31.220.18.39', 22, 'root', 'Travis18456916#')

# Query Supabase via curl directly from VPS since it has the keys
# The anon key is in .env. Let's just use docker exec to run a small node script
node_script = """
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function run() {
  const { data, error } = await supabase
    .from('brands')
    .select('slug, name')
    .ilike('name', '%wilkie%');
  
  console.log(JSON.stringify({data, error}, null, 2));
  
  // Let's also check if 'wilkie-devs' exists exactly
  const { data: exact } = await supabase
    .from('brands')
    .select('slug')
    .eq('slug', 'wilkie-devs');
  
  console.log("Exact match:", JSON.stringify(exact, null, 2));
}
run();
"""

with open('check_db.js', 'w') as f:
    f.write(node_script)

stdin, stdout, stderr = ssh.exec_command('cat > /root/check_db.js')
stdin.write(node_script)
stdin.channel.eof()

stdin, stdout, stderr = ssh.exec_command('docker exec -i lookitry-backend node /app/check_db.js < /root/check_db.js')
print("=== DB QUERY RESULTS ===")
print(stdout.read().decode('utf-8', errors='replace'))
print(stderr.read().decode('utf-8', errors='replace'))

ssh.close()