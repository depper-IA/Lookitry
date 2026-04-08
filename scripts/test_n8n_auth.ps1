[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# First, try to get existing workflows to test authentication
$uri = 'https://n8n.wilkiedevs.com/rest/workflows'
$apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5MjI3YTM0OC0xMzRhLTRiMjYtOGViYy1jYWM4ZDMxZjVmZTAiLCJkb21haW4iOiJuaW4tYWRtaW4iLCJpYXQiOjE3MDY4MTkyMDB9.tkYakJC_4a8L54sN6tYsgGUd9L1V8hZ9P4LqJ8h9mJ4'

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