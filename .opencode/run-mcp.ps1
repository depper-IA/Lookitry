#!/usr/bin/env pwsh
# run-mcp.ps1 - Universal MCP server runner for cross-platform compatibility
# Usage: run-mcp.ps1 <server-name>
# Example: run-mcp.ps1 n8n

param(
    [Parameter(Mandatory=$true)]
    [string]$ServerName
)

$ErrorActionPreference = "Stop"

# Detect base directory - works on both Windows and Linux (via Git Bash/WSL)
$BaseDir = if ($PSScriptRoot) {
    $PSScriptRoot
} elseif ($env:AGENT_WORKSPACE) {
    $env:AGENT_WORKSPACE
} else {
    # Fallback: derive from current directory structure
    (Get-Location).Path
}

# Map server names to their directories
$Servers = @{
    "n8n" = @{
        Path = "mcp-servers\n8n-mcp-server\src\index.ts"
        Description = "n8n workflow management"
    }
    "supabase" = @{
        Path = "mcp-servers\supabase-mcp\src\index.ts"
        Description = "Supabase database"
    }
}

# Validate server name
if (-not $Servers.ContainsKey($ServerName.ToLower())) {
    Write-Error "Unknown server: $ServerName. Valid options: $($Servers.Keys -join ', ')"
    exit 1
}

$Server = $Servers[$ServerName.ToLower()]
$ServerPath = Join-Path -Path $BaseDir -ChildPath $Server.Path

# Check if file exists
if (-not (Test-Path $ServerPath)) {
    # Try alternative path detection for Linux paths on Windows
    $AltPath = $ServerPath -replace '\\', '/'
    if (Test-Path $AltPath) {
        $ServerPath = $AltPath
    } else {
        Write-Error "Server not found: $ServerPath"
        exit 1
    }
}

Write-Host "Starting $($Server.Description) MCP server..."
Write-Host "Server path: $ServerPath"

# Execute with npx tsx
npx tsx $ServerPath