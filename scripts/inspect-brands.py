"""Inspeccionar estructura real de marcas para encontrar el campo correcto"""
import requests, json

BACKEND = 'https://api.pruebalo.wilkiedevs.com'

r = requests.post(
    f'{BACKEND}/api/admin/auth/login',
    json={'email': 'info.samwilkie@gmail.com', 'password': 'Travis2305*'},
    timeout=10
)
token = r.json().get('token')

r2 = requests.get(
    f'{BACKEND}/api/admin/brands',
    headers={'Authorization': f'Bearer {token}'},
    timeout=10
)
data = r2.json()
brands = data if isinstance(data, list) else data.get('brands', data.get('data', []))

# Mostrar las primeras 3 marcas completas para ver la estructura
print(f'Total: {len(brands)} marcas\n')
for b in brands[:3]:
    print(json.dumps(b, indent=2, default=str))
    print('---')
