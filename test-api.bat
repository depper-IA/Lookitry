@echo off
echo Testing API...
curl -X POST "https://api.lookitry.com/api/home/tryon/generate" -H "Content-Type: application/json" -d "{\"productId\":\"demo\",\"selfieBase64\":\"data:image/png;base64,TEST\"}" -w "\nHTTP Status: %%{http_code}\n"
echo Done
pause