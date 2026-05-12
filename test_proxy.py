import requests

url = 'https://api.lookitry.com/api/pruebalo/img-proxy?url=https://wilkiedevs.com/wp-content/uploads/2026/03/casco.png'

resp = requests.get(url)
print(f"Status: {resp.status_code}")
print(f"Body: {resp.text}")
print("Headers:")
for k, v in resp.headers.items():
    print(f"  {k}: {v}")
