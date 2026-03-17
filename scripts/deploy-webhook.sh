#!/bin/bash
# Deploy webhook — ejecuta git pull y rebuilda SOLO lo que cambió
# Instalar: coloca este script en /root/virtual-tryon/deploy.sh
# Llamar desde GitHub Actions o manualmente

set -e
REPO="/root/virtual-tryon"
cd "$REPO"

echo "[deploy] $(date) — iniciando"

# Guardar commit anterior
PREV=$(git rev-parse HEAD)

# Pull
git pull origin main

# Commit nuevo
CURR=$(git rev-parse HEAD)

if [ "$PREV" = "$CURR" ]; then
  echo "[deploy] Sin cambios nuevos. Saliendo."
  exit 0
fi

# Detectar qué cambió
CHANGED=$(git diff --name-only "$PREV" "$CURR")
echo "[deploy] Archivos cambiados:"
echo "$CHANGED"

REBUILD_FRONTEND=false
REBUILD_BACKEND=false

echo "$CHANGED" | grep -q "^frontend/" && REBUILD_FRONTEND=true
echo "$CHANGED" | grep -q "^backend/" && REBUILD_BACKEND=true

# Rebuild solo lo necesario
if [ "$REBUILD_FRONTEND" = true ]; then
  echo "[deploy] Rebuilding frontend..."
  docker compose -f docker-compose.frontend.yml build frontend
  docker compose -f docker-compose.frontend.yml up -d frontend
  echo "[deploy] Frontend actualizado"
fi

if [ "$REBUILD_BACKEND" = true ]; then
  echo "[deploy] Rebuilding backend..."
  docker compose -f docker-compose.backend.yml build backend
  docker compose -f docker-compose.backend.yml up -d backend
  echo "[deploy] Backend actualizado"
fi

echo "[deploy] Listo — commit $CURR"
