# Detailed test to understand n8n response
$headers = @{'Authorization'='Bearer Travis2305**'}

# Test old endpoint with full payload
$body = @{
    brand_id = "550e8400-e29b-41d4-a716-446655440000"
    product_id = "660e8400-e29b-41d4-a716-446655440001"
    selfie_url = "https://minio.wilkiedevs.com/lookitry-test/selfie.jpg"
    product_image_url = "https://minio.wilkiedevs.com/lookitry-test/product.jpg"
    prompt = "A person wearing a blue shirt"
} | ConvertTo-Json -Compress

try {
    $resp = Invoke-WebRequest -Uri 'https://n8n.wilkiedevs.com/webhook/tryon' -Method POST -Body $body -ContentType 'application/json' -Headers $headers -TimeoutSec 15 -UseBasicParsing
    Write-Host "Status: $($resp.StatusCode)"
    Write-Host "Content Length: $($resp.Content.Length)"
    Write-Host "Content Preview: $($resp.Content.Substring(0, [Math]::Min(200, $resp.Content.Length)))"
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        Write-Host "StatusCode: $($_.Exception.Response.StatusCode.value__)"
    }
}

# Also test the descriptor webhook
try {
    $resp2 = Invoke-WebRequest -Uri 'https://n8n.wilkiedevs.com/webhook/descriptor' -Method HEAD -Headers $headers -TimeoutSec 10 -UseBasicParsing
    Write-Host "`nDescriptor Status: $($resp2.StatusCode)"
} catch {
    Write-Host "`nDescriptor Error: $($_.Exception.Message)"
}
