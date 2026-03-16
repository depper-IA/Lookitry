"""Obtener slugs de marcas activas"""
import requests

BACKEND = 'https://api.pruebalo.wilkiedevs.com'

# Login admin
r = requests.post(
    f'{BACKEND}/api/auth/login',
    json={'email': 'info.samwilkie@gmail.com', 'password': 'Travis2305*'},
    timeout=10
)
print(f'Auth login: {r.status_code} -> {r.text[:200]}')

# Intentar admin login
r2 = requests.post(
    f'{BACKEND}/api/admin/login',
    json={'email': 'info.samwilkie@gmail.com', 'password': 'Travis2305*'},
    timeout=10
)
print(f'Admin login: {r2.status_code} -> {r2.text[:300]}')

if r2.status_code == 200:
    token = r2.json().get('token') or r2.json().get('access_token')
    print(f'Token: {token[:50] if token else "N/A"}...')
    
    r3 = requests.get(
        f'{BACKEND}/api/admin/brands',
        headers={'Authorization': f'Bearer {token}'},
        timeout=10
    )
    print(f'\nBrands: {r3.status_code}')
    print(r3.text[:500])
