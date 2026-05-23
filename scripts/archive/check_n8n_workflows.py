#!/usr/bin/env python3
import requests
import json
import sys

api_key = "***REMOVED-SECRET***"

try:
    resp = requests.get(
        "https://n8n.wilkiedevs.com:5678/rest/workflows?active=true",
        headers={"X-N8N-API-KEY": api_key},
        verify=False,
        timeout=10
    )
    data = resp.json()
    workflows = data.get("data", [])
    print(f"Active workflows: {len(workflows)}")
    for w in workflows:
        print(f"  - {w.get('name', 'unnamed')} (id: {w.get('id')}, active: {w.get('active')}, trigger: {w.get('triggerCount', 0)}")
except Exception as e:
    print(f"Error: {e}")