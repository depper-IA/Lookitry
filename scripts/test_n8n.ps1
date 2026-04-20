$body = '{}'
try {
    $resp = Invoke-WebRequest -Uri 'https://n8n.wilkiedevs.com/webhook/tryon' -Method POST -Body $body -ContentType 'application/json' -Headers @{'Authorization'='Bearer Travis2305**'} -TimeoutSec 10 -UseBasicParsing
    Write-Host "Status: $($resp.StatusCode)"
    Write-Host "Content: $($resp.Content)"
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        Write-Host "StatusCode: $($_.Exception.Response.StatusCode.value__)"
    }
}
