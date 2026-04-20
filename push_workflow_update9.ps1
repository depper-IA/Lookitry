$apiKey = "***REMOVED-SECRET***"
$workflowId = "ZjVTV3QxoPEi60GX"
$url = "https://n8n.wilkiedevs.com/api/v1/workflows/$workflowId"

# Get current workflow
$workflow = Invoke-RestMethod -Uri $url -Method GET -Headers @{'X-N8N-API-KEY'=$apiKey}

# THE FIXED PROMPT
$fixedPrompt = 'You are a fashion vision expert. Analyze this product image.

CRITICAL: Output ONLY valid JSON. No markdown. No code blocks. Start with { and end with }.

{
  "garment_type": "type of garment",
  "silhouette": "silhouette style",
  "primary_color": "main color",
  "secondary_colors": ["color1"] or [],
  "patterns": "patterns or null",
  "materials": "materials",
  "design_details": {
    "neckline": "neckline",
    "sleeves": "sleeves",
    "closures": "closures",
    "pockets": "pockets or null",
    "other": "other or null"
  },
  "fit": "fitted | regular | loose | oversize",
  "suggested_category": "ONE OF: Camiseta, Hoodie, Chaqueta, Pantalones, Zapatos, Accesorios, Otros"
}'

# Update the node
$nodes = $workflow.activeVersion.nodes
for ($i = 0; $i -lt $nodes.Count; $i++) {
    if ($nodes[$i].name -eq "Analyze an image") {
        $nodes[$i].parameters.text = $fixedPrompt
        break
    }
}

# Get credentials from the node
$googleCreds = $workflow.activeVersion.nodes[2].credentials.googlePalmApi
Write-Host "Credentials: $($googleCreds.name) ($($googleCreds.id))"

# Build payload matching what GET returns - exact same structure
$updatePayload = @{
    id = $workflowId
    name = $workflow.name
    description = $workflow.description
    nodes = $workflow.activeVersion.nodes
    connections = $workflow.activeVersion.connections
    settings = $workflow.settings
    staticData = $workflow.staticData
    tags = $workflow.tags
    active = $workflow.active
    isArchived = $workflow.isArchived
    versionId = $workflow.versionId
} | ConvertTo-Json -Depth 20

# Save for debugging
$updatePayload | Set-Content -Path "C:\Users\Matt\Lookitry\workflow_update_payload.json" -Encoding UTF8

Write-Host "Sending PUT with full payload..."

$request = [System.Net.WebRequest]::Create($url)
$request.Method = "PUT"
$request.Headers.Add("X-N8N-API-KEY", $apiKey)
$request.ContentType = "application/json"
$request.ServicePoint.Expect100Continue = $false

$bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($updatePayload)
$request.ContentLength = $bodyBytes.Length

try {
    $requestStream = $request.GetRequestStream()
    $requestStream.Write($bodyBytes, 0, $bodyBytes.Length)
    $requestStream.Close()

    $response = $request.GetResponse()
    $streamReader = New-Object System.IO.StreamReader($response.GetResponseStream())
    $responseBody = $streamReader.ReadToEnd()

    Write-Host "=== SUCCESS ==="
    Write-Host "Status: $($response.StatusCode)"
    Write-Host "Response: $($responseBody.Substring(0, [Math]::Min(500, $responseBody.Length)))"
}
catch {
    Write-Host "=== ERROR ==="
    Write-Host $_.Exception.Message

    $response = $_.Exception.Response
    if ($response) {
        Write-Host "Status: $($response.StatusCode) $($response.StatusDescription)"
        Write-Host "Headers:"
        $response.Headers.AllKeys | ForEach-Object { Write-Host "  $_ : $($response.Headers[$_])" }

        $stream = $response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $errBody = $reader.ReadToEnd()
        Write-Host "Body length: $($errBody.Length)"
        Write-Host "Body: $($errBody)"
    }
}
