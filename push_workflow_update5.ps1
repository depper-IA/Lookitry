$apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NGUxZTYyYi1kY2M0LTRiZGUtOWFjZS02OTBmMjAxMGIyMDAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiZWE2NmI1N2ItNTBiNS00ZTViLWJhYzYtZDE2MWFkM2NkZTkzIiwiaWF0IjoxNzczMjc5MzMyfQ.ZuYsz4K4ifpp9ho_nZzpDypTy49_APNx9hkecKridJw"
$workflowId = "ZjVTV3QxoPEi60GX"
$url = "https://n8n.wilkiedevs.com/api/v1/workflows/$workflowId"

# Get current workflow
Write-Host "Fetching current workflow..."
$workflow = Invoke-RestMethod -Uri $url -Method GET -Headers @{'X-N8N-API-KEY'=$apiKey}

# Debug: check what fields are in the workflow object
Write-Host "=== WORKFLOW FIELDS ==="
$workflow.PSObject.Properties | Select-Object Name

# Find the Analyze an image node
$nodes = $workflow.activeVersion.nodes
$analyzeNode = $nodes | Where-Object { $_.name -eq "Analyze an image" }

# THE FIXED PROMPT
$fixedPrompt = 'You are a fashion vision expert. Analyze this product image: "{{ $json.productName }}" (category: {{ $json.category }}).

CRITICAL: You must respond with ONLY valid JSON. No text before or after. No markdown. No code blocks. Start immediately with the first character of the JSON.

Required JSON structure:
{
  "garment_type": "exact garment type",
  "silhouette": "silhouette/cut style",
  "primary_color": "main color (name + hex like #FF0000)",
  "secondary_colors": ["color1", "color2"] or [],
  "patterns": "visible patterns, logos, graphics, or null",
  "materials": "apparent materials or textures",
  "design_details": {
    "neckline": "neckline type",
    "sleeves": "sleeve type",
    "closures": "closures or buttons",
    "pockets": "visible pockets or null",
    "other": "other relevant details or null"
  },
  "fit": "fitted | regular | loose | oversize",
  "suggested_category": "ONE of: Camiseta, Hoodie, Chaqueta, Pantalones, Zapatos, Accesorios, Otros"
}

Respond with ONLY JSON. Nothing else. Begin now.'

# Update the node's text parameter
$analyzeNode.parameters.text = $fixedPrompt

# Update the model to gemini-2.0-flash
$analyzeNode.parameters.modelId.value = "models/gemini-2.0-flash"
$analyzeNode.parameters.modelId.cachedResultName = "models/gemini-2.0-flash"

# Find the node index and update it
for ($i = 0; $i -lt $nodes.Count; $i++) {
    if ($nodes[$i].name -eq "Analyze an image") {
        $workflow.activeVersion.nodes[$i] = $analyzeNode
        Write-Host "Updated node at index $i"
        break
    }
}

# Try with minimal payload matching what n8n actually needs
$updatePayload = @{
    name = $workflow.name
    nodes = $workflow.activeVersion.nodes
    connections = $workflow.connections
    settings = $workflow.settings
    active = $workflow.active
    versionId = $workflow.versionId
    staticData = $null
    tags = $workflow.tags
} | ConvertTo-Json -Depth 30

# Write to file for debugging
$updatePayload | Set-Content -Path "C:\Users\Matt\Lookitry\workflow_update_payload.json" -Encoding UTF8

Write-Host "Payload size: $($updatePayload.Length)"

# Try the request with verbose error handling
$request = [System.Net.WebRequest]::Create($url)
$request.Method = "PUT"
$request.Headers.Add("X-N8N-API-KEY", $apiKey)
$request.ContentType = "application/json"
$request.Accept = "application/json"

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
    Write-Host $responseBody
}
catch {
    Write-Host "=== ERROR ==="
    Write-Host $_.Exception.Message
    if ($_.Exception.InnerException) {
        Write-Host "Inner: $($_.Exception.InnerException.Message)"
    }
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    $responseBody = $reader.ReadToEnd()
    Write-Host "Response body length: $($responseBody.Length)"
    Write-Host "Response body: $responseBody"
}
