import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("31.220.18.39", username="root", password="Travis18456916#", timeout=15)

cmd = """
VOL_PATH=$(docker volume inspect n8n_data --format '{{.Mountpoint}}')
sqlite3 $VOL_PATH/database.sqlite "SELECT nodes FROM workflow_entity WHERE id='wPLypk7KhBcFLicX';"
"""
stdin, stdout, stderr = client.exec_command(cmd)
nodes_json = stdout.read().decode('utf-8')

import json
try:
    nodes = json.loads(nodes_json)
    for node in nodes:
        if node.get("type") == "n8n-nodes-base.code":
            print(f"--- CODE NODE: {node.get('name')} ---")
            print(node.get("parameters", {}).get("jsCode", ""))
            
        elif node.get("type") == "n8n-nodes-base.webhook":
            print(f"--- WEBHOOK NODE: {node.get('name')} ---")
            print(node.get("parameters", {}))
except Exception as e:
    print("Error:", e)
    print("Raw output:", nodes_json)
    
client.close()
