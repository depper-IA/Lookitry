"""
Crea una campaña trial activa via API de admin.
"""
import json
import urllib.request

API = "https://api.lookitry.com"

# 1. Login admin
login_data = json.dumps({"email": "info.samwilkie@gmail.com", "password": "Travis2305*"}).encode()
req = urllib.request.Request(f"{API}/api/admin/auth/login", data=login_data,
                              headers={"Content-Type": "application/json"}, method="POST")
with urllib.request.urlopen(req) as r:
    token = json.loads(r.read())["token"]
print(f"Token obtenido: {token[:30]}...")

# 2. Listar campañas existentes
req2 = urllib.request.Request(f"{API}/api/admin/trial-campaign",
                               headers={"Authorization": f"Bearer {token}"})
with urllib.request.urlopen(req2) as r:
    data = json.loads(r.read())
print("Campañas existentes:", json.dumps(data, indent=2))

# 3. Si no hay campaña activa, crear una
active = data.get("activeCampaign")
if active:
    print(f"\nYa existe campaña activa: {active['name']} ({active['trial_days']} dias)")
else:
    print("\nNo hay campaña activa. Creando una...")
    body = json.dumps({
        "name": "Trial permanente",
        "trial_days": 7,
        "ends_at": None,
        "active": True,
        "require_card_verification": True,
    }).encode()
    req3 = urllib.request.Request(f"{API}/api/admin/trial-campaign", data=body,
                                   headers={"Content-Type": "application/json",
                                            "Authorization": f"Bearer {token}"}, method="POST")
    with urllib.request.urlopen(req3) as r:
        result = json.loads(r.read())
    print("Campaña creada:", json.dumps(result, indent=2))

# 4. Verificar estado público
req4 = urllib.request.Request(f"{API}/api/trial/status")
with urllib.request.urlopen(req4) as r:
    status = json.loads(r.read())
print("\nEstado publico del trial:", json.dumps(status, indent=2))
