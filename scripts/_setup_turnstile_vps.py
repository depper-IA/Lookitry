"""Script temporal para configurar Turnstile en el VPS"""
import paramiko, time

SITE_KEY = "0x4AAAAAACsmy7e_yL9iyAXM"
SECRET_KEY = "0x4AAAAAACsmy2ZsVW10HlNhDRP-ihDmo3o"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("31.220.18.39", username="root", password="Travis18456916#", timeout=30)
print("Conectado al VPS")

# 1. Actualizar docker-compose.frontend.yml
_, out, _ = ssh.exec_command("cat /root/virtual-tryon/docker-compose.frontend.yml")
content = out.read().decode()

old_line = "        NEXT_PUBLIC_N8N_DESCRIPTOR_URL: https://n8n.wilkiedevs.com/webhook/descriptor"
new_line = old_line + f"\n        NEXT_PUBLIC_TURNSTILE_SITE_KEY: {SITE_KEY}"

if "TURNSTILE_SITE_KEY" not in content:
    content = content.replace(old_line, new_line)
    stdin, _, _ = ssh.exec_command("cat > /root/virtual-tryon/docker-compose.frontend.yml")
    stdin.write(content)
    stdin.channel.shutdown_write()
    time.sleep(1)
    print("docker-compose.frontend.yml actualizado")
else:
    print("SITE_KEY ya estaba en docker-compose")

# Verificar
_, out, _ = ssh.exec_command("grep TURNSTILE /root/virtual-tryon/docker-compose.frontend.yml")
print("docker-compose:", out.read().decode().strip())

# 2. Agregar al backend .env del VPS
_, out, _ = ssh.exec_command("grep TURNSTILE /root/virtual-tryon/backend/.env")
existing = out.read().decode()

if "TURNSTILE" not in existing:
    env_lines = (
        "\n# Cloudflare Turnstile\n"
        f"TURNSTILE_SECRET_KEY={SECRET_KEY}\n"
        "TURNSTILE_ENABLED=true\n"
    )
    stdin, _, _ = ssh.exec_command("cat >> /root/virtual-tryon/backend/.env")
    stdin.write(env_lines)
    stdin.channel.shutdown_write()
    time.sleep(1)
    print("Turnstile agregado al backend .env del VPS")
else:
    print("Ya existia en backend .env:", existing.strip())

# Verificar backend .env
_, out, _ = ssh.exec_command("grep TURNSTILE /root/virtual-tryon/backend/.env")
print("backend .env:", out.read().decode().strip())

ssh.close()
print("Listo")
