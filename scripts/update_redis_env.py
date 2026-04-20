import os

path = '/root/virtual-tryon/backend/.env.production'
with open(path, 'r') as f:
    content = f.read()

content = content.replace('zrOKXaFIgXOuu/sEMcVRwAN9mxsdTWU8VY9tuncbHpk=', 'Redis2024SecurePassNoSlash')

with open(path, 'w') as f:
    f.write(content)

print('Updated successfully')
print('New REDIS_URL:', content.split('REDIS_URL=')[1].split('\n')[0])
print('New REDIS_PASSWORD:', content.split('REDIS_PASSWORD=')[1].split('\n')[0])