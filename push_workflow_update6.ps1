$apiKey = "***REMOVED-SECRET***"
$workflowId = "ZjVTV3QxoPEi60GX"
$url = "https://n8n.wilkiedevs.com/api/v1/workflows/$workflowId"

# Get current workflow as raw JSON (no processing)
$rawJson = Invoke-RestMethod -Uri $url -Method GET -Headers @{'X-N8N-API-KEY'=$apiKey} -ContentType "application/json"

# Convert to JSON string to manipulate
$jsonString = $rawJson | ConvertTo-Json -Depth 30
$jsonObj = $jsonString | ConvertFrom-Json

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

# Find and update the Analyze an image node in activeVersion.nodes
$found = $false
for ($i = 0; $i -lt $jsonObj.activeVersion.nodes.Count; $i++) {
    if ($jsonObj.activeVersion.nodes[$i].name -eq "Analyze an image") {
        $jsonObj.activeVersion.nodes[$i].parameters.text = $fixedPrompt
        $jsonObj.activeVersion.nodes[$i].parameters.modelId.value = "models/gemini-2.0-flash"
        $jsonObj.activeVersion.nodes[$i].parameters.modelId.cachedResultName = "models/gemini-2.0-flash"
        Write-Host "Updated node in activeVersion.nodes at index $i"
        $found = $true
        break
    }
}

if (-not $found) {
    Write-Host "ERROR: Could not find Analyze an image node"
    exit 1
}

# Also update root-level nodes if present
for ($i = 0; $i -lt $jsonObj.nodes.Count; $i++) {
    if ($jsonObj.nodes[$i].name -eq "Analyze an image") {
        $jsonObj.nodes[$i].parameters.text = $fixedPrompt
        $jsonObj.nodes[$i].parameters.modelId.value = "models/gemini-2.0-flash"
        $jsonObj.nodes[$i].parameters.modelId.cachedResultName = "models/gemini-2.0-flash"
        Write-Host "Updated node in root nodes at index $i"
        break
    }
}

# Update versionId to trigger update
$jsonObj.versionId = $jsonObj.activeVersion.versionId

# Prepare the update payload - match exact structure n8n expects
$updatePayload = @{
    name = $jsonObj.name
    nodes = $jsonObj.nodes
    connections = $jsonObj.connections
    settings = $jsonObj.settings
    staticData = $jsonObj.staticData
    tags = $jsonObj.tags
    active = $jsonObj.active
    versionId = $jsonObj.versionId
} | ConvertTo-Json -Depth 30

# Write to file for verification
$updatePayload | Set-Content -Path "C:\Users\Matt\Lookitry\workflow_update_payload.json" -Encoding UTF8

Write-Host "Payload ready. Size: $($updatePayload.Length) chars"

# Try PUT with raw JSON string
try {
    $response = Invoke-RestMethod -Uri $url -Method PUT `
        -Headers @{
            'X-N8N-API-KEY' = $apiKey
            'Content-Type' = 'application/json'
        } `
        -Body $updatePayload `
        -ErrorAction Stop

    Write-Host "=== SUCCESS ==="
    Write-Host "Updated workflow: $($response.name)"
    Write-Host "Version ID: $($response.versionId)"
}
catch {
    Write-Host "=== ERROR ==="
    Write-Host $_.Exception.Message

    # Try to get more error details
    try {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response body: $responseBody"
    } catch {}
}
