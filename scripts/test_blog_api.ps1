$headers = @{ 'x-blog-secret' = 'Travis2305**_blog_n8n' }
$body = (@{ topic_id = 'test'; title = 'Test Article' } | ConvertTo-Json -Compress)
$resp = Invoke-WebRequest -Uri 'https://api.lookitry.com/api/blog/article-content' -Method POST -ContentType 'application/json' -Body $body -Headers $headers -TimeoutSec 30 -UseBasicParsing
Write-Host "Status:" $resp.StatusCode
Write-Host "Content:" $resp.Content.Substring(0, [Math]::Min(500, $resp.Content.Length))
