$apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NGUxZTYyYi1kY2M0LTRiZGUtOWFjZS02OTBmMjAxMGIyMDAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiZWE2NmI1N2ItNTBiNS00ZTViLWJhYzYtZDE2MWFkM2NkZTkzIiwiaWF0IjoxNzczMjc5MzMyfQ.ZuYsz4K4ifpp9ho_nZzpDypTy49_APNx9hkecKridJw"
$workflowId = "ZjVTV3QxoPEi60GX"
$url = "https://n8n.wilkiedevs.com/api/v1/workflows/$workflowId"

# Get current workflow
$workflow = Invoke-RestMethod -Uri $url -Method GET -Headers @{'X-N8N-API-KEY'=$apiKey}

# Find the Analyze an image node
$nodes = $workflow.activeVersion.nodes
$analyzeNode = $nodes | Where-Object { $_.name -eq "Analyze an image" }

# THE FIXED PROMPT - Much more explicit about JSON-only
$fixedPrompt = 'You are a fashion vision expert. Analyze this product image: "{{ $json.productName }}" (category: {{ $json.category }}).

CRITICAL: You must respond with ONLY valid JSON. No text before or after. No markdown. No code blocks. Start immediately with the first character of the JSON.

Required JSON structure (fill every field):
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

# Update the model to gemini-2.0-flash (better JSON compliance)
$analyzeNode.parameters.modelId.value = "models/gemini-2.0-flash"
$analyzeNode.parameters.modelId.cachedResultName = "models/gemini-2.0-flash"

# Find the node index and update it
for ($i = 0; $i -lt $nodes.Count; $i++) {
    if ($nodes[$i].name -eq "Analyze an image") {
        $workflow.activeVersion.nodes[$i] = $analyzeNode
        break
    }
}

# Add version comment
$workflow.activeVersion.description = "Fixed: Gemini prompt - force JSON-only response, changed to gemini-2.0-flash for better structured output"

# Convert to JSON for update
$body = @{
    name = $workflow.name
    nodes = $workflow.activeVersion.nodes
    connections = $workflow.connections
    settings = $workflow.settings
    staticData = $workflow.staticData
    tags = $workflow.tags
    metadata = $workflow.metadata
} | ConvertTo-Json -Depth 20

# Write to file for verification
$body | Set-Content -Path "C:\Users\Matt\Lookitry\workflow_update_payload.json" -Encoding UTF8

Write-Host "=== FIXED PROMPT ==="
Write-Host $fixedPrompt
Write-Host ""
Write-Host "=== MODEL ==="
Write-Host $analyzeNode.parameters.modelId.value
Write-Host ""
Write-Host "Payload written to workflow_update_payload.json"
