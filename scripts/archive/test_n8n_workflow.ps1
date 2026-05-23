# Test n8n workflow webhook with correct workflow ID
$headers = @{'Authorization'='Bearer Travis2305**'}

# Test workflow ID wPLypk7KhBcFLicX
try {
    $resp = Invoke-WebRequest -Uri 'https://n8n.wilkiedevs.com/webhook/wPLypk7KhBcFLicX' -Method POST -Body '{}' -ContentType 'application/json' -Headers $headers -TimeoutSec 10 -UseBasicParsing
    Write-Host "Workflow wPLypk7KhBcFLicX Status: $($resp.StatusCode)"
    Write-Host "Response: $($resp.Content)"
} catch {
    Write-Host "Error for wPLypk7KhBcFLicX: $($_.Exception.Message)"
}

# Test old endpoint
try {
    $resp2 = Invoke-WebRequest -Uri 'https://n8n.wilkiedevs.com/webhook/tryon' -Method POST -Body '{}' -ContentType 'application/json' -Headers $headers -TimeoutSec 10 -UseBasicParsing
    Write-Host "Old tryon endpoint Status: $($resp2.StatusCode)"
} catch {
    Write-Host "Error for old tryon: $($_.Exception.Message)"
}
