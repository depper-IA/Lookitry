import paramiko

def update_traefik():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect('31.220.18.39', port=22, username='root', password='Travis18456916#')

    s = ssh.open_sftp()

    # Writing security-headers.yml
    sh_content = """http:
  middlewares:
    strip-headers:
      headers:
        customResponseHeaders:
          Server: ""
          X-Powered-By: ""
          X-AspNet-Version: ""
          X-AspNetMvc-Version: ""
"""
    f = s.open('/docker/traefik-reverse-proxy/dynamic/security-headers.yml', 'w')
    f.write(sh_content)
    f.close()

    # Writing docker-compose.yml
    dc_content = """version: '3.8'

services:
  traefik:
    image: traefik:v2.10
    container_name: traefik
    command:
      - --api.insecure=false
      - --api.dashboard=true
      - --providers.docker=true
      - --providers.docker.endpoint=unix:///var/run/docker.sock
      - --providers.docker.network=proxy
      - --providers.docker.exposedByDefault=false
      - --providers.file.directory=/dynamic
      - --providers.file.watch=true
      - --entrypoints.web.address=:80
      - --entrypoints.websecure.address=:443
      - --entrypoints.web.http.redirections.entrypoint.to=websecure
      - --entrypoints.web.http.redirections.entrypoint.scheme=https
      - --certificatesResolvers.mytlschallenge.acme.email=samwilkiedevs@gmail.com
      - --certificatesResolvers.mytlschallenge.acme.storage=/certs/acme.json
      - --certificatesResolvers.mytlschallenge.acme.httpchallenge.entrypoint=web
      - --log.level=INFO
      - --entrypoints.websecure.forwardedHeaders.trustedIPs=127.0.0.1/32,172.16.0.0/12
      - --entrypoints.web.forwardedHeaders.trustedIPs=127.0.0.1/32,172.16.0.0/12
      - --entrypoints.websecure.http.middlewares=strip-headers@file
      - --entrypoints.web.http.middlewares=strip-headers@file
    ports:
      - 80:80
      - 443:443
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./certs:/certs
      - ./dynamic:/dynamic
    networks:
      - proxy
    restart: unless-stopped

networks:
  proxy:
    external: true
"""
    f = s.open('/docker/traefik-reverse-proxy/docker-compose.yml', 'w')
    f.write(dc_content)
    f.close()

    s.close()

    # Restart Traefik
    stdin, stdout, stderr = ssh.exec_command('cd /docker/traefik-reverse-proxy && docker compose down && docker compose up -d')
    print("STDOUT:", stdout.read().decode())
    print("STDERR:", stderr.read().decode())

    ssh.close()
    print("SUCCESS")

if __name__ == '__main__':
    update_traefik()
