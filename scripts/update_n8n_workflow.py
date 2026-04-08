#!/usr/bin/env python3
import json
import sys
import requests

# Read the workflow update data
with open("workflow_refactored.json", "r") as f:
    workflow_data = json.load(f)

# n8n API configuration
N8N_URL = "https://n8n.wilkiedevs.com"
WORKFLOW_ID = "VMAu93Zx4k5qgzdm"
API_KEY = ""  # Need to provide API key

# Read current workflow
response = requests.get(
    f"{N8N_URL}/api/v1/workflows/{WORKFLOW_ID}",
    headers={"Authorization": f"Bearer {API_KEY}"},
)
current = response.json()

# Merge updates
current["nodes"] = workflow_data["nodes"]
current["connections"] = workflow_data["connections"]
current["settings"] = workflow_data.get(
    "settings", {"callerPolicy": "workflowsFromSameOwner"}
)

# Update workflow
update_response = requests.put(
    f"{N8N_URL}/api/v1/workflows/{WORKFLOW_ID}",
    headers={"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"},
    json=current,
)

print(f"Status: {update_response.status_code}")
print(f"Response: {update_response.text}")
