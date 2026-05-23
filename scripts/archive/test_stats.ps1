$ErrorActionPreference = 'Stop'
try {
    $result = Invoke-RestMethod -Uri 'https://api.lookitry.com/landing-stats' -Method GET
    $result | ConvertTo-Json -Depth 3
} catch {
    Write-Host "Status: $($_.Exception.Response.StatusCode.value__)"
    Write-Host "Error: $($_.Exception.Message)"
}
