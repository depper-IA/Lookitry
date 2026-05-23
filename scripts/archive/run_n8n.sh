#!/bin/bash
docker run -d \
  --name root-n8n-1 \
  --network proxy \
  --restart unless-stopped \
  -v n8n_data:/home/node/.n8n \
  -e N8N_RUNNERS_ENABLED=false \
  -e N8N_NATIVE_PYTHON_RUNNER=false \
  -e N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS=true \
  -e N8N_RELEASE_TYPE=stable \
  -l traefik.enable=true \
  -l "traefik.http.routers.n8n.rule=Host(\`n8n.wilkiedevs.com\`)" \
  -l traefik.http.routers.n8n.entrypoints=websecure \
  -l traefik.http.routers.n8n.tls.certresolver=mytlschallenge \
  -l traefik.http.services.n8n.loadbalancer.server.port=5678 \
  docker.n8n.io/n8nio/n8n:latest
