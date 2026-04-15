#!/usr/bin/env bash
# run-mcp.sh - Universal MCP server runner for cross-platform compatibility
# Usage: ./run-mcp.sh <server-name>
# Example: ./run-mcp.sh n8n

set -e

# Detect base directory
BASE_DIR="${AGENT_WORKSPACE:-$(dirname "$0")}"

# Map server names to their directories
declare -A SERVERS=(
    ["n8n"]="mcp-servers/n8n-mcp-server/src/index.ts"
    ["supabase"]="mcp-servers/supabase-mcp/src/index.ts"
)

# Validate server name
if [ -z "$1" ]; then
    echo "Usage: $0 <server-name>"
    echo "Valid options: ${!SERVERS[@]}"
    exit 1
fi

SERVER_NAME="$1"

if [ -z "${SERVERS[$SERVER_NAME]}" ]; then
    echo "Unknown server: $SERVER_NAME"
    echo "Valid options: ${!SERVERS[@]}"
    exit 1
fi

SERVER_PATH="$BASE_DIR/${SERVERS[$SERVER_NAME]}"

# Check if file exists
if [ ! -f "$SERVER_PATH" ]; then
    echo "Error: Server not found at $SERVER_PATH"
    exit 1
fi

echo "Starting $SERVER_NAME MCP server..."
echo "Server path: $SERVER_PATH"

# Execute with npx tsx
cd "$(dirname "$SERVER_PATH")"
npx tsx src/index.ts