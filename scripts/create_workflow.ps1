[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$body = Get-Content -Path 'C:\Users\Matt\Lookitry\scripts\workflow_payload.json' -Raw -Encoding UTF8

$result = curl.exe -X POST `
    -H 'Content-Type: application/json' `
    -H 'X-N8N-API-KEY: ***REMOVED-SECRET***' `
    --data $body `
    'https://n8n.wilkiedevs.com/rest/workflows' `
    --connect-timeout 60 `
    -w "`nHTTP_CODE:%{http_code}"

Write-Output $result