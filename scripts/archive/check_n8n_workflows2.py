#!/usr/bin/env python3
import requests
import json

api_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NGUxZTYyYi1kY2M0LTRiZGUtOWFjZS02OTBmMjAxMGIyMDAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiZWE2NmI1N2ItNTBiNS00ZTViLWJhYzYtZDE2MWFkM2NkZTkzIiwiaWF0IjoxNzczMjc5MzMyfQ.ZuYsz4K4ifpp9ho_nZzpDypTy49_APNx9hkecKridJw"

try:
    resp = requests.get(
        "http://root-n8n-1:5678/rest/workflows?active=true",
        headers={"X-N8N-API-KEY": api_key},
        timeout=10
    )
    data = resp.json()
    workflows = data.get("data", [])
    print(f"Active workflows: {len(workflows)}")
    for w in workflows:
        print(f"  - {w.get('name', 'unnamed')} (id: {w.get('id')}, active: {w.get('active')}, triggerCount: {w.get('triggerCount', 0)}")
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)