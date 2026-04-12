#!/bin/bash

# verify_openclaw.sh - Health Check Script for OpenClaw & Sammy

echo "🦞 Iniciando Verificación de OpenClaw..."

# 1. Verificar si el Gateway está corriendo
if ps aux | grep -v grep | grep "openclaw-gateway" > /dev/null
then
    echo "✅ Gateway: EN EJECUCIÓN"
else
    echo "❌ Gateway: NO DETECTADO. Intenta ejecutar ./opencode"
fi

# 2. Verificar integridad del archivo openclaw.json
if [ -f "/home/travis/Lookitry/openclaw/openclaw.json" ]; then
    echo "✅ Archivo Config: ENCONTRADO"
    # Podríamos usar jq para validar esquema si estuviera instalado
else
    echo "❌ Archivo Config: NO ENCONTRADO en /home/travis/Lookitry/openclaw/openclaw.json"
fi

# 3. Verificar directorios de Agentes
echo "📂 Verificando Directorios de Agentes..."
AGENTS=("sammy" "webwizard" "devguardian" "dataalchemist" "growthpilot" "architectai" "docs-writter" "security-auditor" "rebecca" "leo")

for agent in "${AGENTS[@]}"; do
    if [ -d "/home/travis/Lookitry/Lookitry/$agent" ]; then
        echo "  - $agent: ✅ OK"
    else
        echo "  - $agent: ❌ NO ENCONTRADO"
    fi
done

# 4. Verificar acceso al Cerebro
if [ -d "/home/travis/Lookitry/Lookitry/Lookitry_Brain_Vault/Cerebro" ]; then
    echo "✅ Cerebro Vault: ACCESIBLE"
else
    echo "❌ Cerebro Vault: NO ACCESIBLE en /home/travis/Lookitry/Lookitry/Lookitry_Brain_Vault/Cerebro"
fi

# 5. Estado de Sammy (Sessions check)
if [ -f "/home/travis/.openclaw/agents/sammy/sessions/sessions.json" ]; then
    LAST_SESSION=$(ls -t /home/travis/.openclaw/agents/sammy/sessions/sessions.json 2>/dev/null)
    if [ ! -z "$LAST_SESSION" ]; then
        echo "✅ Sammy: Sesiones activas detectadas."
    else
        echo "⚠️ Sammy: Sin historial de sesiones recientes."
    fi
fi

echo "🦞 Verificación Finalizada."
