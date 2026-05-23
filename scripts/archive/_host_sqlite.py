import sys
import paramiko
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("31.220.18.39", username="root", password="Travis18456916#", timeout=15)

cmd = """
# Find volume path
VOL_PATH=$(docker volume inspect n8n_data --format '{{.Mountpoint}}')
DB_FILE="$VOL_PATH/database.sqlite"

echo "Checking if DB exists at $DB_FILE"
if test -f "$DB_FILE"; then
    echo "Found!"
    python3 -c "
import sqlite3
import json
try:
    conn = sqlite3.connect('$DB_FILE')
    cursor = conn.cursor()
    cursor.execute('SELECT name FROM sqlite_master WHERE type=\\"table\\";')
    tables = [t[0] for t in cursor.fetchall()]
    
    target_table = 'workflow_entity' if 'workflow_entity' in tables else 'workflowEntity'
    
    # Check all workflows targeting lookitry/tryon
    cursor.execute(f'SELECT id, name, active FROM {target_table};')
    all_workflows = cursor.fetchall()
    
    print('All Workflows Check:')
    for w in all_workflows:
        print(f'ID: {w[0]}, Name: {w[1]}, Active: {w[2]}')

    # Activate
    cursor.execute(f'UPDATE {target_table} SET active=1 WHERE id=\\"wPLypk7KhBcFLicX\\";')
    conn.commit()
    print('\\nActivated successfully!')
    cursor.execute(f'SELECT id, name, active FROM {target_table} WHERE id=\\"wPLypk7KhBcFLicX\\";')
    print('Verify:', cursor.fetchall())
    conn.close()
except Exception as e:
    print('Error:', e)
"
else
    echo "DB not found"
fi
"""

stdin, stdout, stderr = client.exec_command(cmd, timeout=30)
print(stdout.read().decode("utf-8", errors="replace"))
print(stderr.read().decode("utf-8", errors="replace"))

client.close()
