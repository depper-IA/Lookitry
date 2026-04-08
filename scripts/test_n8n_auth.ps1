[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# First, try to get existing workflows to test authentication
$uri = 'https://n8n.wilkiedevs.com/rest/workflows'
$apiKey = '***REMOVED-SECRET***'

try {
    $response = Invoke-RestMethod -Uri "$uri?limit=1" -Method GET -Headers @{'X-N8N-API-KEY' = $apiKey}
    Write-Output "AUTH OK - Connected to n8n"
    Write-Output "User: $($response.data[0].user)"
} catch {
    Write-Output "AUTH FAILED: $($_.Exception.Message)"
}

# Try with Bearer token format
try {
    $response2 = Invoke-RestMethod -Uri "$uri?limit=1" -Method GET -Headers @{'Authorization' = "Bearer $apiKey"}
    Write-Output "Bearer auth OK"
} catch {
    Write-Output "Bearer auth failed: $($_.Exception.Message)"
}