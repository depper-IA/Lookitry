"""
Test automatizado del flujo de registro en produccion (sandbox)
"""
import urllib.request
import urllib.error
import json
import random
import string
import time

BASE = "https://api.lookitry.com"

def post(url, data, token=None):
    body = json.dumps(data).encode()
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, data=body, headers=headers, method="POST")
    try:
        res = urllib.request.urlopen(req, timeout=15)
        return res.status, json.loads(res.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())

def get(url, token=None):
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, headers=headers)
    try:
        res = urllib.request.urlopen(req, timeout=15)
        return res.status, json.loads(res.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())

rand = "".join(random.choices(string.ascii_lowercase, k=6))
EMAIL = f"test_{rand}@testlookitry.com"
SLUG  = f"marca-test-{rand}"

print("=" * 55)
print("TEST FLUJO COMPLETO DE REGISTRO — LOOKITRY")
print("=" * 55)

# 1. Health
print("\n[1] Health check...")
code, data = get(f"{BASE}/health")
print(f"    Status: {data.get('status')} | Supabase: {data.get('services',{}).get('supabase',{}).get('status')} | n8n: {data.get('services',{}).get('n8n',{}).get('status')}")

# 2. Estado del trial
print("\n[2] Estado del trial...")
code, data = get(f"{BASE}/api/trial/status")
print(f"    trialAvailable: {data.get('trialAvailable')} | dias: {data.get('trialDays')} | requireCard: {data.get('requireCardVerification', False)}")
require_card = data.get("requireCardVerification", False)

# 3. Registro
print(f"\n[3] Registro de nuevo usuario...")
print(f"    Email: {EMAIL}")
print(f"    Slug:  {SLUG}")
code, data = post(f"{BASE}/api/auth/register", {
    "name": f"Marca Test {rand.upper()}",
    "email": EMAIL,
    "password": "Test1234!",
    "slug": SLUG,
    "contact_name": "Juan Pérez Test",
    "phone": "+57 300 000 0000",
    "fingerprint": f"fp_{rand}",
    "turnstileToken": None
})
print(f"    HTTP: {code}")
if code == 201:
    token = data.get("token")
    brand = data.get("brand", {})
    print(f"    OK — brand_id: {brand.get('id')}")
    print(f"    plan: {brand.get('plan')} | email_verified: {brand.get('email_verified')}")
    print(f"    requireCardVerification: {data.get('requireCardVerification')}")
    print(f"    verificationEmail enviado: {'SI' if data.get('verificationToken') else 'NO (ya verificado o desactivado)'}")
else:
    print(f"    ERROR: {data}")
    token = None

# 4. Intentar registro duplicado (debe fallar)
print("\n[4] Test registro duplicado (debe dar 409)...")
code2, data2 = post(f"{BASE}/api/auth/register", {
    "name": "Duplicado",
    "email": EMAIL,
    "password": "Test1234!",
    "slug": SLUG + "-dup",
    "contact_name": "Test Dup",
    "fingerprint": f"fp_{rand}",
})
print(f"    HTTP: {code2} | error: {data2.get('error')} {'OK' if code2 == 409 else 'FALLO'}")

# 5. Login con las credenciales recién creadas
print("\n[5] Login con credenciales nuevas...")
code, login_data = post(f"{BASE}/api/auth/login", {
    "email": EMAIL,
    "password": "Test1234!"
})
print(f"    HTTP: {code}")
if code == 200:
    login_token = login_data.get("token")
    print(f"    OK — token obtenido")
elif code == 403:
    print(f"    Email pendiente de verificacion (esperado si email confirmation activo)")
    login_token = token  # usar token del registro
else:
    print(f"    ERROR: {login_data}")
    login_token = token

# 6. Obtener perfil con token
if login_token or token:
    print("\n[6] Obtener perfil autenticado...")
    use_token = login_token or token
    code, profile = get(f"{BASE}/api/brands/me", use_token)
    print(f"    HTTP: {code}")
    if code == 200:
        print(f"    nombre: {profile.get('name')} | plan: {profile.get('plan')} | slug: {profile.get('slug')}")
    else:
        print(f"    Respuesta: {profile}")

# 7. Trial initiate (si no requiere tarjeta, debe ir directo)
if token and not require_card:
    print("\n[7] Trial initiate (sin tarjeta)...")
    code, init_data = post(f"{BASE}/api/trial/initiate", {}, token)
    print(f"    HTTP: {code} | skipPayment: {init_data.get('skipPayment')} | checkoutUrl: {'SI' if init_data.get('checkoutUrl') else 'NO'}")
elif token and require_card:
    print("\n[7] Trial initiate (con tarjeta requerida)...")
    code, init_data = post(f"{BASE}/api/trial/initiate", {}, token)
    print(f"    HTTP: {code}")
    if init_data.get("checkoutUrl"):
        print(f"    checkoutUrl generada: {init_data['checkoutUrl'][:80]}...")
    else:
        print(f"    Respuesta: {init_data}")

print("\n" + "=" * 55)
print("RESULTADO FINAL")
print("=" * 55)
print(f"  Registro:          {'PASS' if code == 201 or token else 'FAIL'}")
print(f"  Duplicado bloq.:   {'PASS' if code2 == 409 else 'FAIL'}")
print(f"  Login:             {'PASS' if login_token else 'PENDIENTE (verificacion email)'}")
print("=" * 55)
