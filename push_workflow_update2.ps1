$apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NGUxZTYyYi1kY2M0LTRiZGUtOWFjZS02OTBmMjAxMGIyMDAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiZWE2NmI1N2ItNTBiNS00ZTViLWJhYzYtZDE2MWFkM2NkZTkzIiwiaWF0IjoxNzczMjc5MzMyfQ.ZuYsz4K4ifpp9ho_nZzpDypTy49_APNx9hkecKridJw"
$workflowId = "ZjVTV3QxoPEi60GX"
$url = "https://n8n.wilkiedevs.com/api/v1/workflows/$workflowId"

# Get current workflow
Write-Host "Fetching current workflow..."
$workflow = Invoke-RestMethod -Uri $url -Method GET -Headers @{'X-N8N-API-KEY'=$apiKey}

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

# Create update payload matching n8n API format
$updatePayload = @{
    id = $workflowId
    name = $workflow.name
    nodes = $workflow.activeVersion.nodes
    connections = $workflow.connections
    settings = $workflow.settings
    staticData = $workflow.staticData
    tags = $workflow.tags
    active = $workflow.active
    versionId = $workflow.versionId
} | ConvertTo-Json -Depth 30

# Write to file for debugging
$updatePayload | Set-Content -Path "C:\Users\Matt\Lookitry\workflow_update_payload.json" -Encoding UTF8

Write-Host "=== UPDATE PAYLOAD (first 2000 chars) ==="
($updatePayload.Substring(0, [Math]::Min(2000, $updatePayload.Length))) -replace "`n", " | "

# Push the update with correct headers
Write-Host "Pushing update to n8n..."
try {
    $response = Invoke-RestMethod -Uri $url -Method PATCH -Headers @{
        'X-N8N-API-KEY' = $apiKey
        'Content-Type' = 'application/json'
    } -Body $updatePayload

    Write-Host "=== SUCCESS ==="
    Write-Host "Updated workflow: $($response.name)"
    Write-Host "Version ID: $($response.versionId)"
}
catch {
    Write-Host "=== ERROR ==="
    Write-Host $_.Exception.Message
    $_.Exception.Response.Headers
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    $responseBody = $reader.ReadToEnd()
    Write-Host "Response body: $responseBody"
}
