$headers = @{'Authorization'='Bearer Travis2305**'}
try {
    # Health check
    $health = Invoke-WebRequest -Uri 'https://n8n.wilkiedevs.com/webhook/tryon' -Method GET -Headers $headers -TimeoutSec 10 -UseBasicParsing
    Write-Host "GET Status: $($health.StatusCode)"

    # POST with full payload test
    $body = @{
        brand_id = "test-brand-id"
        product_id = "test-product-id"
        selfie_url = "https://example.com/selfie.jpg"
        product_image_url = "https://example.com/product.jpg"
        prompt = "Test prompt"
    } | ConvertTo-Json -Compress

    $resp = Invoke-WebRequest -Uri 'https://n8n.wilkiedevs.com/webhook/tryon' -Method POST -Body $body -ContentType 'application/json' -Headers $headers -TimeoutSec 15 -UseBasicParsing
    Write-Host "POST Status: $($resp.StatusCode)"
    Write-Host "Response: $($resp.Content)"
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        Write-Host "StatusCode: $($_.Exception.Response.StatusCode.value__)"
    }
}
