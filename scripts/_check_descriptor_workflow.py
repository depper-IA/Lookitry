import paramiko
import json
import sys

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('31.220.18.39', username='root', password='Travis18456916#', timeout=15)

# Workflow ZjVTV3QxoPEi60GX (Descriptor)
cmd = 'docker exec root-n8n-1 sqlite3 /bitnami/n8n/database.sqlite "SELECT nodes FROM workflow_entity WHERE id=\'ZjVTV3QxoPEi60GX\';"'
stdin, stdout, stderr = client.exec_command(cmd)
nodes_json = stdout.read().decode('utf-8', errors='replace')

try:
    nodes = json.loads(nodes_json)
    for i, node in enumerate(nodes):
        name = node.get('name', 'unnamed')
        ntype = node.get('type', 'unknown')
        print(f'=== Node {i+1}: {name} | Type: {ntype} ===')

        if ntype == 'n8n-nodes-base.code':
            code = node.get('parameters', {}).get('jsCode', '')
            lines = code.split('\n')
            print(f'Code lines: {len(lines)}')
            print('--- CODE START ---')
            for j, line in enumerate(lines, 1):
                print(f'{j}: {line}')
            print('--- CODE END ---')

        elif ntype == 'n8n-nodes-base.webhook':
            print('Webhook params:', json.dumps(node.get('parameters', {}), indent=2))

        print()
except Exception as e:
    print(f'Error: {e}')
    print(f'Raw (first 2000 chars): {nodes_json[:2000]}')

client.close()