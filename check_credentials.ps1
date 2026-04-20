$apiKey = "***REMOVED-SECRET***"
$url = "https://n8n.wilkiedevs.com/api/v1/credentials"

# Get credentials to check which one is used
$creds = Invoke-RestMethod -Uri $url -Method GET -Headers @{'X-N8N-API-KEY'=$apiKey}
$creds.data | Where-Object { $_.name -like "*sam*" -or $_.name -like "*Palm*" } | Select-Object id, name, type
