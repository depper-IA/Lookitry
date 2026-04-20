$body = @{
    brand_id = "test-brand-id"
    product_id = "test-product-id"
    selfie_url = "https://example.com/selfie.jpg"
    product_image_url = "https://example.com/product.jpg"
    prompt = "A person wearing a red dress"
} | ConvertTo-Json

try {
    $resp = Invoke-WebRequest -Uri 'https://n8n.wilkiedevs.com/webhook/tryon' -Method POST -Body $body -ContentType 'application/json' -Headers @{'Authorization'='Bearer Travis2305**'} -TimeoutSec 15 -UseBasicParsing
    Write-Host "Status: $($resp.StatusCode)"
    Write-Host "Content: $($resp.Content)"
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        Write-Host "StatusCode: $($_.Exception.Response.StatusCode.value__)"
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $reader.BaseStream.Position = 0
        Write-Host "ResponseBody: $($reader.ReadToEnd())"
    }
}
