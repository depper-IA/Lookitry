# Comprehensive n8n webhook test
$headers = @{'Authorization'='Bearer Travis2305**'}

$tests = @(
    @{Name="Try-On (old path)"; Url="https://n8n.wilkiedevs.com/webhook/tryon"},
    @{Name="Try-On (workflow ID)"; Url="https://n8n.wilkiedevs.com/webhook/wPLypk7KhBcFLicX"},
    @{Name="Descriptor"; Url="https://n8n.wilkiedevs.com/webhook/descriptor"},
    @{Name="Descriptor (workflow ID)"; Url="https://n8n.wilkiedevs.com/webhook/ZjVTV3QxoPEi60GX"},
    @{Name="n8n Root"; Url="https://n8n.wilkiedevs.com/"}
)

foreach ($test in $tests) {
    try {
        $resp = Invoke-WebRequest -Uri $test.Url -Method HEAD -Headers $headers -TimeoutSec 8 -UseBasicParsing
        Write-Host "$($test.Name): $($resp.StatusCode)"
    } catch {
        $statusCode = if ($_.Exception.Response) { $_.Exception.Response.StatusCode.value__ } else { "Error" }
        Write-Host "$($test.Name): $statusCode - $($_.Exception.Message.Substring(0, [Math]::Min(80, $_.Exception.Message.Length)))"
    }
}

# Try POST to tryon
Write-Host "`n--- POST Test to /webhook/tryon ---"
$body = @{
    brand_id = "test-brand"
    product_id = "test-product"
    selfie_url = "https://example.com/s.jpg"
    product_image_url = "https://example.com/p.jpg"
    prompt = "test"
} | ConvertTo-Json -Compress

try {
    $resp = Invoke-WebRequest -Uri 'https://n8n.wilkiedevs.com/webhook/tryon' -Method POST -Body $body -ContentType 'application/json' -Headers $headers -TimeoutSec 10 -UseBasicParsing
    Write-Host "POST Status: $($resp.StatusCode)"
    Write-Host "Response: $($resp.Content)"
} catch {
    Write-Host "POST Error: $($_.Exception.Message)"
}
