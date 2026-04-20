# Check both production webhook URLs
$headers = @{'Authorization'='Bearer Travis2305**'}

# Production uses workflow ID wPLypk7KhBcFLicX per .env.production
$prodTests = @(
    @{Name="Production Try-On URL (wPLypk7KhBcFLicX)"; Url="https://n8n.wilkiedevs.com/webhook/wPLypk7KhBcFLicX"},
    @{Name="Old Try-On Path (/webhook/tryon)"; Url="https://n8n.wilkiedevs.com/webhook/tryon"},
    @{Name="n8n root"; Url="https://n8n.wilkiedevs.com/"}
)

foreach ($test in $prodTests) {
    try {
        $resp = Invoke-WebRequest -Uri $test.Url -Method HEAD -Headers $headers -TimeoutSec 8 -UseBasicParsing
        Write-Host "$($test.Name): $($resp.StatusCode)"
    } catch {
        $code = if ($_.Exception.Response) { $_.Exception.Response.StatusCode.value__ } else { "NA" }
        Write-Host "$($test.Name): HTTP $code"
    }
}

# Check if the backend is running by looking at its health endpoint
Write-Host "`n--- Backend Health Check ---"
try {
    $resp = Invoke-WebRequest -Uri 'https://api.lookitry.com/' -Method GET -TimeoutSec 8 -UseBasicParsing
    Write-Host "Backend Root: $($resp.StatusCode)"
} catch {
    Write-Host "Backend Root: Error - $($_.Exception.Message.Substring(0,80))"
}
