import urllib.request
import urllib.error

url = 'https://api.lookitry.com/api/pruebalo/wilkie-devs'
headers = {
    'Origin': 'https://lookitry.com',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
}

try:
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=10) as response:
        print("Status:", response.status)
        print("Response:", response.read().decode('utf-8')[:200])
except urllib.error.HTTPError as e:
    print("HTTP Error:", e.code)
    print("Response:", e.read().decode('utf-8')[:200])
except Exception as e:
    print("Error:", e)