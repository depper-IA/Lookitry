import sqlite3
import json

try:
    conn = sqlite3.connect('/var/lib/docker/volumes/n8n_data/_data/database.sqlite')
    cursor = conn.cursor()

    cursor.execute('SELECT id, name, active, nodes FROM workflow_entity')
    rows = cursor.fetchall()
    print("=== WORKFLOWS WITH /tryon WEBHOOK ===")
    for row in rows:
        w_id, name, active, nodes_json = row
        if 'tryon' in str(nodes_json):
            print(f"ID: {w_id} | Name: {name} | Active: {active}")
            # Buscar el nodo Webhook
            try:
                nodes = json.loads(nodes_json)
                for node in nodes:
                    if node.get('type') == 'n8n-nodes-base.webhook':
                        path = node.get('parameters', {}).get('path', '')
                        print(f"  -> Webhook Node: '{node.get('name')}', Path: '{path}'")
            except Exception:
                pass
    conn.close()
except Exception as e:
    print(f"Error: {str(e)}")
