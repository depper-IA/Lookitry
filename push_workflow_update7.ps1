$apiKey = "***REMOVED-SECRET***"
$workflowId = "ZjVTV3QxoPEi60GX"
$url = "https://n8n.wilkiedevs.com/api/v1/workflows/$workflowId"

# Get current workflow
$workflow = Invoke-RestMethod -Uri $url -Method GET -Headers @{'X-N8N-API-KEY'=$apiKey}

# THE FIXED PROMPT - Same model, just better prompt
$fixedPrompt = 'You are a fashion vision expert. Analyze this product image: "{{ $json.productName }}" (category: {{ $json.category }}).

CRITICAL INSTRUCTION: You must output ONLY valid JSON. No explanations. No text before or after. No markdown formatting. No code blocks. Your response must start with the first character of the JSON object and end with the last.

Required JSON format:
{
  "garment_type": "type of garment",
  "silhouette": "silhouette style",
  "primary_color": "main color (name + hex)",
  "secondary_colors": ["color1", "color2"] or [],
  "patterns": "patterns or null",
  "materials": "materials visible",
  "design_details": {
    "neckline": "neckline",
    "sleeves": "sleeves",
    "closures": "closures",
    "pockets": "pockets or null",
    "other": "other details or null"
  },
  "fit": "fitted | regular | loose | oversize",
  "suggested_category": "ONE OF: Camiseta, Hoodie, Chaqueta, Pantalones, Zapatos, Accesorios, Otros"
}

Start your response with { and end with }. Nothing else.'

# Update the node keeping original model
$nodes = $workflow.activeVersion.nodes
for ($i = 0; $i -lt $nodes.Count; $i++) {
    if ($nodes[$i].name -eq "Analyze an image") {
        $nodes[$i].parameters.text = $fixedPrompt
        # Keep original model
        Write-Host "Keeping original model: $($nodes[$i].parameters.modelId.value)"
        break
    }
}

# Create update payload - minimal fields
$updatePayload = @{
    name = $workflow.name
    nodes = $workflow.activeVersion.nodes
    connections = $workflow.connections
    settings = $workflow.settings
    active = $workflow.active
    versionId = $workflow.versionId
} | ConvertTo-Json -Depth 20

# Save for debugging
$updatePayload | Set-Content -Path "C:\Users\Matt\Lookitry\workflow_update_payload.json" -Encoding UTF8

Write-Host "Trying update with fixed prompt only..."

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
}
