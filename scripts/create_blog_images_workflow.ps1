$body = '{
  "name": "Lookitry Blog Image Generator",
  "nodes": [
    {
      "id": "wh-img-001",
      "name": "Webhook Trigger",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2.2,
      "position": [200, 300],
      "webhookId": "lookitry-blog-images",
      "parameters": {
        "httpMethod": "POST",
        "path": "lookitry-blog-images",
        "options": {}
      }
    },
    {
      "id": "code-gen-prompts",
      "name": "Generar Prompts",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [400, 300],
      "parameters": {
        "jsCode": "const title = $input.first()?.json?.title || '"'"''"'"';\nconst topicId = $input.first()?.json?.topic_id || '"'"''"'"';\nconst keywords = $input.first()?.json?.keywords || '"'"''"'"';\n\nfunction slugify(text) {\n  return text.toLowerCase().replace(/[^a-z0-9]+/g, '"'"'-'"'"').replace(/^-+|-+$/g, '"'"''"'"');\n}\n\nconst baseSlug = slugify(title).substring(0, 40);\nconst prompts = [\n  {\n    prompt: `"'"'Editorial fashion photography, ${title}, Colombian ecommerce style, warm lighting, professional studio backdrop, commercial photography, high-end retail context, 16:9 aspect ratio`"'"'`,\n    tipo: '"'"'hero'"'"',\n    aspect_ratio: '"'"'16:9'"'"'\n  },\n  {\n    prompt: `"'"'Lifestyle fashion editorial, ${title}, Colombian boutique interior, natural lighting, candid retail moment, approachable luxury aesthetic, 16:9 aspect ratio`"'"'`,\n    tipo: '"'"'body1'"'"',\n    aspect_ratio: '"'"'16:9'"'"'\n  },\n  {\n    prompt: `"'"'Close-up fashion detail, ${title}, texture and fabric focus, minimal background, Colombian fashion retail, professional product photography, 16:9 aspect ratio`"'"'`,\n    tipo: '"'"'body2'"'"',\n    aspect_ratio: '"'"'16:9'"'"'\n  }\n];\n\nreturn prompts.map(p => ({\n  json: {\n    topic_id: topicId,\n    title,\n    keywords,\n    ...p\n  }\n}));"
      }
    },
    {
      "id": "loop-prompts",
      "name": "Loop Prompts",
      "type": "n8n-nodes-base.splitInBatches",
      "typeVersion": 3,
      "position": [600, 300],
      "parameters": {
        "options": {
          "reset": true
        }
      }
    },
    {
      "id": "replicate-flux",
      "name": "Replicate FLUX",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [800, 200],
      "parameters": {
        "method": "POST",
        "url": "https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Authorization",
              "value": "Bearer r8_D4VY9Ay3avB9k5qMARUTqD09qIaiTne3TKVu0"
            },
            {
              "name": "Content-Type",
              "value": "application/json"
            },
            {
              "name": "Prefer",
              "value": "wait=10"
            }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={ "input": { "prompt": $json.prompt, "aspect_ratio": $json.aspect_ratio || "16:9", "output_format": "png", "output_quality": 90, "num_inference_steps": 4, "go_fast": true, "megapixels": "1" }}",
        "options": {
          "timeout": 120000
        },
        "retryOnFail": true,
        "waitBetweenTries": 5000
      }
    },
    {
      "id": "code-extract-url",
      "name": "Extraer URL Imagen",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1000, 200],
      "parameters": {
        "jsCode": "const response = $input.item.json;\nconst currentItem = $('"'"'Loop Prompts'"'"').item.json;\nconst token = '"'"'r8_D4VY9Ay3avB9k5qMARUTqD09qIaiTne3TKVu0'"'"';\n\nasync function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }\n\nasync function getPrediction(url) {\n  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}`, '"'"'Content-Type'"'"': '"'"'application/json'"'"' } });\n  if (!res.ok) throw new Error(`Replicate lookup failed (${res.status}): ${await res.text()}`);\n  return await res.json();\n}\n\nasync function resolvePrediction(pred) {\n  let cur = pred;\n  for (let i = 0; i < 30; i++) {\n    if (cur?.error) throw new Error(`Replicate error: ${cur.error}`);\n    if (cur?.status === '"'"'failed'"'"' || cur?.status === '"'"'canceled'"'"') throw new Error(`Replicate ${cur.status}. ID: ${cur.id}`);\n    if (cur?.status === '"'"'succeeded'"'"' && cur?.output) {\n      const imageUrl = Array.isArray(cur.output) ? cur.output[0] : cur.output;\n      await sleep(12000);\n      return { imageUrl, predictionId: cur.id };\n    }\n    const pollUrl = cur?.urls?.get;\n    if (!pollUrl) throw new Error(`Sin poll URL. Status: ${cur?.status}`);\n    await sleep(4000);\n    cur = await getPrediction(pollUrl);\n  }\n  throw new Error('"'"'Replicate timeout'"'"');\n}\n\nconst result = await resolvePrediction(response);\nreturn [{ json: {\n  ...currentItem,\n  imageUrl: result.imageUrl,\n  predictionId: result.predictionId\n} }];"
      }
    },
    {
      "id": "http-download",
      "name": "Descargar Imagen",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [1200, 200],
      "parameters": {
        "url": "={{ $json.imageUrl }}",
        "options": {
          "response": {
            "response": {
              "responseFormat": "file"
            }
          }
        }
      }
    },
    {
      "id": "code-rename",
      "name": "Renombrar Archivo",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1400, 200],
      "parameters": {
        "mode": "runOnceForEachItem",
        "jsCode": "const item = $input.item;\nconst tipo = item.json.tipo || '"'"'imagen'"'"';\nconst filename = `${tipo}-${Date.now()}.png`;\n\nif (item.binary?.data) {\n  item.binary.data.fileName = filename;\n  item.binary.data.mimeType = '"'"'image/png'"'"';\n}\n\nreturn { json: { ...item.json, filename }, binary: item.binary };"
      }
    },
    {
      "id": "http-upload",
      "name": "Subir a MinIO",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [1600, 200],
      "parameters": {
        "method": "POST",
        "url": "https://api.lookitry.com/api/blog/upload",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "x-blog-secret",
              "value": "Travis2305**_blog_n8n"
            }
          ]
        },
        "sendBody": true,
        "contentType": "multipart-form-data",
        "bodyParameters": {
          "parameters": [
            {
              "parameterType": "formBinaryData",
              "name": "file",
              "inputDataFieldName": "data"
            },
            {
              "name": "filename",
              "value": "={{ $('"'"'Renombrar Archivo'"'"').item.binary.data.fileName }}"
            }
          ]
        },
        "options": {}
      }
    },
    {
      "id": "code-consolidate",
      "name": "Consolidar URLs",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1800, 300],
      "parameters": {
        "jsCode": "const items = $input.all();\nconst topicId = items[0]?.json?.topic_id || '"'"''"'"';\n\nconst byType = {};\nfor (const item of items) {\n  const img = item.json;\n  if (img.tipo && img.url) {\n    byType[img.tipo] = { url: img.url, path: img.path };\n  }\n}\n\nreturn [{ json: {\n  topic_id: topicId,\n  imagen_hero_url: byType.hero?.url || '"'"''"'"',\n  imagen_hero_id: byType.hero?.path || null,\n  imagen_body1_url: byType.body1?.url || '"'"''"'"',\n  imagen_body1_id: byType.body1?.path || null,\n  imagen_body2_url: byType.body2?.url || '"'"''"'"',\n  imagen_body2_id: byType.body2?.path || null\n} }];"
      }
    }
  ],
  "connections": {
    "Webhook Trigger": {
      "main": [
        [{"node": "Generar Prompts", "type": "main", "index": 0}]
      ]
    },
    "Generar Prompts": {
      "main": [
        [{"node": "Loop Prompts", "type": "main", "index": 0}]
      ]
    },
    "Loop Prompts": {
      "main": [
        [{"node": "Replicate FLUX", "type": "main", "index": 0}],
        [{"node": "Consolidar URLs", "type": "main", "index": 0}]
      ]
    },
    "Replicate FLUX": {
      "main": [
        [{"node": "Extraer URL Imagen", "type": "main", "index": 0}]
      ]
    },
    "Extraer URL Imagen": {
      "main": [
        [{"node": "Descargar Imagen", "type": "main", "index": 0}]
      ]
    },
    "Descargar Imagen": {
      "main": [
        [{"node": "Renombrar Archivo", "type": "main", "index": 0}]
      ]
    },
    "Renombrar Archivo": {
      "main": [
        [{"node": "Subir a MinIO", "type": "main", "index": 0}]
      ]
    },
    "Subir a MinIO": {
      "main": [
        [{"node": "Loop Prompts", "type": "main", "index": 0}]
      ]
    }
  },
  "settings": {
    "executionOrder": "v1",
    "binaryMode": "separate",
    "callerPolicy": "workflowsFromSameOwner",
    "errorWorkflow": "PNri7NdZYkZhpPnm"
  },
  "active": true
}'

$apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5MjI3YTM0OC0xMzRhLTRiMjYtOGViYy1jYWM4ZDMxZjVmZTAiLCJkb21haW4iOiJuaW4tYWRtaW4iLCJpYXQiOjE3MDY4MTkyMDB9.tkYakJC_4a8L54sN6tYsgGUd9L1V8hZ9P4LqJ8h9mJ4'

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Use curl.exe to POST the workflow
$tempFile = [System.IO.Path]::GetTempFileName() + '.json'
Set-Content -Path $tempFile -Value $body -Encoding UTF8

$result = curl.exe -X POST `
    -H "Content-Type: application/json" `
    -H "X-N8N-API-KEY: $apiKey" `
    --data-binary "@$tempFile" `
    "https://n8n.wilkiedevs.com/rest/workflows" `
    --connect-timeout 30 `
    -w "`nHTTP_CODE:%{http_code}"

Remove-Item $tempFile -ErrorAction SilentlyContinue

Write-Output $result