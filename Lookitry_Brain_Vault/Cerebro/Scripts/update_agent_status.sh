#!/bin/bash
# Script para marcar/unmark agentes como activos
# Uso: ./update_agent_status.sh <agent_id> <on|off> [session_key]

AGENT_ID=$1
ACTION=$2
SESSION_KEY=$3
STATUS_FILE="/home/travis/Lookitry/Lookitry/Lookitry_Brain_Vault/Cerebro/Estado/active_agents.json"

if [ -z "$AGENT_ID" ] || [ -z "$ACTION" ]; then
  echo "Uso: $0 <agent_id> <on|off> [session_key]"
  exit 1
fi

if [ "$ACTION" = "on" ]; then
  # Agregar agente activo
  if [ -f "$STATUS_FILE" ]; then
    # Usar jq si está disponible, si no usar sed
    if command -v jq &> /dev/null; then
      UPDATED=$(jq --arg id "$AGENT_ID" --arg key "$SESSION_KEY" --arg ts "$(date -Iseconds)" \
        '.activeAgents += [{"agentId": $id, "sessionKey": $key, "startedAt": $ts}] | .lastUpdated = $ts' \
        "$STATUS_FILE")
      echo "$UPDATED" > "$STATUS_FILE"
    else
      echo "{\"lastUpdated\": \"$(date -Iseconds)\", \"activeAgents\": [{\"agentId\": \"$AGENT_ID\", \"sessionKey\": \"$SESSION_KEY\", \"startedAt\": \"$(date -Iseconds)\"}]}" > "$STATUS_FILE"
    fi
  fi
  echo "✅ Agente $AGENT_ID marcado como ACTIVO"
else
  # Remover agente activo
  if [ -f "$STATUS_FILE" ]; then
    if command -v jq &> /dev/null; then
      UPDATED=$(jq --arg id "$AGENT_ID" \
        '.activeAgents = [.activeAgents[] | select(.agentId != $id)] | .lastUpdated = "'$(date -Iseconds)'"' \
        "$STATUS_FILE")
      echo "$UPDATED" > "$STATUS_FILE"
    else
      echo "{\"lastUpdated\": \"$(date -Iseconds)\", \"activeAgents\": []}" > "$STATUS_FILE"
    fi
  fi
  echo "🔴 Agente $AGENT_ID marcado como INACTIVO"
fi
