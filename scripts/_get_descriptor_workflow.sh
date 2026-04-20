#!/bin/bash
# Extract descriptor workflow nodes

# Copy DB
docker cp root-n8n-1:/bitnami/n8n/database.sqlite /tmp/n8n_db.sqlite

# Extract nodes to file
sqlite3 /tmp/n8n_db.sqlite "SELECT nodes FROM workflow_entity WHERE id='ZjVTV3QxoPEi60GX';" > /tmp/nodes.txt

# Output
echo "=== WORKFLOW NODES ==="
cat /tmp/nodes.txt | head -c 5000