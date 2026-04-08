[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$body = Get-Content -Path 'C:\Users\Matt\Lookitry\scripts\workflow_payload.json' -Raw -Encoding UTF8

$result = curl.exe -X POST `
    -H 'Content-Type: application/json' `
    -H 'X-N8N-API-KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5MjI3YTM0OC0xMzRhLTRiMjYtOGViYy1jYWM4ZDMxZjVmZTAiLCJkb21haW4iOiJuaW4tYWRtaW4iLCJpYXQiOjE3MDY4MTkyMDB9.tkYakJC_4a8L54sN6tYsgGUd9L1V8hZ9P4LqJ8h9mJ4' `
    --data $body `
    'https://n8n.wilkiedevs.com/rest/workflows' `
    --connect-timeout 60 `
    -w "`nHTTP_CODE:%{http_code}"

Write-Output $result