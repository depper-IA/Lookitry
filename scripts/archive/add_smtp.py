import os

filepath = '/root/virtual-tryon/backend/.env.production'

# Read current content
with open(filepath, 'r') as f:
    content = f.read()

# SMTP config to add
smtp_config = """
# Email Configuration (SMTP)
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=info@lookitry.com
SMTP_PASS=Travis2305*
SMTP_FROM=LOOKITRY <info@lookitry.com>

# Frontend URL for email links
FRONTEND_URL=https://lookitry.com
"""

# Check if SMTP already exists
if 'SMTP_HOST' not in content:
    content += smtp_config
    print("Added SMTP config to .env.production")
else:
    print("SMTP already exists in .env.production")

# Write back
with open(filepath, 'w') as f:
    f.write(content)

print("Done!")
print("\nSMTP config added:")
print("SMTP_HOST=smtp.hostinger.com")
print("SMTP_PORT=465")
print("SMTP_SECURE=true")
print("SMTP_USER=info@lookitry.com")
print("SMTP_PASS=Travis2305*")