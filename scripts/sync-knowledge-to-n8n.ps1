param(
    [string]$VaultPath = "C:\Users\Matt\Lookitry\Lookitry_Brain_Vault\Cerebro\Knowledge Base",
    [string]$Webhook   = "https://n8n.wilkiedevs.com/webhook/sync-knowledge"
)

Write-Host "Reading vault: $VaultPath" -ForegroundColor Cyan

if (-not (Test-Path $VaultPath)) {
    Write-Host "ERROR: Vault folder not found: $VaultPath" -ForegroundColor Red
    exit 1
}

$files = Get-ChildItem $VaultPath -Filter "*.md" | Where-Object { $_.Name -notlike "_*" }
Write-Host "Found $($files.Count) notes" -ForegroundColor Cyan

$items = @()

foreach ($file in $files) {
    $raw = Get-Content $file.FullName -Raw -Encoding UTF8

    # Parse frontmatter
    $fm = @{}
    if ($raw -match "(?s)^---\r?\n(.*?)\r?\n---\r?\n") {
        $fmBlock = $Matches[1]
        foreach ($line in ($fmBlock -split "`n")) {
            $line = $line.Trim()
            if ($line -match "^(\w+):\s*(.+)$") {
                $key = $Matches[1]
                $val = $Matches[2].Trim()
                $fm[$key] = switch ($val) {
                    "true"  { $true }
                    "false" { $false }
                    default { $val }
                }
            }
        }
    }

    if (-not $fm["kb_id"] -or -not $fm["kb_category"]) {
        Write-Host "  SKIP $($file.Name): missing kb_id or kb_category" -ForegroundColor Yellow
        continue
    }

    # Extract H1 title
    $title = $file.BaseName
    if ($raw -match "(?m)^#\s+(.+)$") {
        $title = $Matches[1].Trim()
    }

    # Body = everything after frontmatter, without the H1
    $body = $raw -replace "(?s)^---\r?\n.*?\r?\n---\r?\n", ""
    $body = $body -replace "(?m)^#\s+.+\r?\n?", ""
    $body = $body.Trim()

    $isActive = $true
    if ($fm.ContainsKey("kb_active")) { $isActive = [bool]$fm["kb_active"] }

    $items += [ordered]@{
        id        = $fm["kb_id"]
        category  = $fm["kb_category"]
        title     = $title
        content   = $body
        is_active = $isActive
    }

    Write-Host "  OK  $($fm['kb_id']) - $title" -ForegroundColor Green
}

if ($items.Count -eq 0) {
    Write-Host "ERROR: No valid items found" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Sending $($items.Count) items to n8n..." -ForegroundColor Cyan

$payload = @{ items = $items } | ConvertTo-Json -Depth 10

$bytes   = [System.Text.Encoding]::UTF8.GetBytes($payload)

try {
    $response = Invoke-RestMethod `
        -Uri $Webhook `
        -Method POST `
        -ContentType "application/json; charset=utf-8" `
        -Body $bytes

    Write-Host ""
    Write-Host "Sync complete: $($response.synced) items synced" -ForegroundColor Green
    Write-Host "Timestamp: $($response.timestamp)" -ForegroundColor Gray

    if ($response.items) {
        foreach ($item in $response.items) {
            Write-Host "  - $($item.id)" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "ERROR calling n8n: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Check that the workflow is active at: https://n8n.wilkiedevs.com" -ForegroundColor Yellow
    exit 1
}
