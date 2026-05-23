import os
import sys
import requests
import json

# Get API key from command line argument or environment
api_key = sys.argv[1] if len(sys.argv) > 1 else os.environ.get('N8N_API_KEY', '')
if not api_key:
    print('N8N_API_KEY not found - pass as argument or set in environment')
    exit(1)

# n8n API v1 endpoint
url = 'https://n8n.wilkiedevs.com/api/v1/workflows/wPLypk7KhBcFLicX'

headers = {
    'Content-Type': 'application/json',
    'X-N8N-API-KEY': api_key
}

# Full workflow with all nodes restored and the updated Vertex AI node
payload = {
    "name": "Virtual Try-On - Flujo Completo (Vertex AI)",
    "nodes": [
        {
            "parameters": {
                "httpMethod": "POST",
                "path": "tryon",
                "responseMode": "responseNode",
                "options": {}
            },
            "id": "e82e4cf5-2ca7-4251-9eb5-ad0f237d9247",
            "name": "Webhook",
            "type": "n8n-nodes-base.webhook",
            "typeVersion": 2,
            "position": [25136, 4192],
            "webhookId": "e225a330-9cec-4dc1-9179-8e22cb16fc27"
        },
        {
            "parameters": {
                "jsCode": "const input = $input.item.json;\nconst body = input.body || input;\nif (!body || typeof body !== 'object') {\n  throw new Error('Payload inválido. Recibido: ' + JSON.stringify(input).substring(0, 200));\n}\n\nconst required = ['brand_id', 'product_id', 'selfie_url', 'product_image_url', 'prompt'];\nconst missing = required.filter(f => !body[f]);\nif (missing.length > 0) {\n  throw new Error('Faltan campos requeridos: ' + missing.join(', '));\n}\n\nconst urlFields = ['selfie_url', 'product_image_url'];\nconst urlRegex = /^https?:\\/\\/.+/;\n\n\nfor (const field of urlFields) {\n  if (!urlRegex.test(body[field])) {\n    throw new Error(`${field} no es URL válida: \"${body[field]}\"`);\n  }\n  body[field] = body[field].trim();\n}\n\nlet prompt = (body.prompt || '').trim();\nif (prompt.length < 3) {\n  throw new Error('Prompt demasiado corto');\n}\nif (prompt.length > 4000) {\n  prompt = prompt.substring(0, 4000);\n}\n\nconst brand_id = String(body.brand_id).trim();\nconst product_id = String(body.product_id).trim();\n\nconst now = new Date();\nconst timestamp = now.toISOString();\nconst timestamp_safe = timestamp.replace(/[:.]/g, '-');\n\nreturn {\n  json: {\n    brand_id,\n    product_id,\n    selfie_url: body.selfie_url,\n    product_image_url: body.product_image_url,\n    prompt,\n    timestamp,\n    timestamp_safe\n  }\n};\n"
            },
            "id": "e8589f07-b9bd-4ae2-8077-24ae20fa9482",
            "name": "Validar Input",
            "type": "n8n-nodes-base.code",
            "typeVersion": 2,
            "position": [25328, 4192]
        },
        {
            "parameters": {
                "jsCode": "const data = $('Validar Input').item.json;\nreturn { json: { brand_id: data.brand_id, product_id: data.product_id, product_image_url: data.product_image_url, timestamp: data.timestamp, timestamp_safe: data.timestamp_safe, full_prompt: data.prompt, selfie_url: data.selfie_url } };"
            },
            "id": "8affdc31-9bea-4f2d-aff2-53ada9dbff28",
            "name": "Preparar Prompt Gemini",
            "type": "n8n-nodes-base.code",
            "typeVersion": 2,
            "position": [25536, 4192]
        },
        {
            "parameters": {
                "url": "={{ $json.selfie_url }}",
                "options": {
                    "response": {
                        "response": {
                            "responseFormat": "file",
                            "outputPropertyName": "selfie_bin",
                        }
                    },
                    "timeout": 30000
                }
            },
            "id": "17a3479b-cacf-4463-ad16-094c85c5c51d",
            "name": "Descargar Selfie",
            "type": "n8n-nodes-base.httpRequest",
            "typeVersion": 4.2,
            "position": [25760, 4192]
        },
        {
            "parameters": {
                "url": "={{ $('Preparar Prompt Gemini').item.json.product_image_url }}",
                "options": {
                    "response": {
                        "response": {
                            "responseFormat": "file",
                            "outputPropertyName": "product_bin"
                        }
                    },
                    "timeout": 30000
                }
            },
            "id": "bcc45c4a-e66b-4757-85cb-8c3f0b630dc6",
            "name": "Descargar Producto",
            "type": "n8n-nodes-base.httpRequest",
            "typeVersion": 4.2,
            "position": [25984, 4192]
        },
        {
            "parameters": {
                "jsCode": "const d = $('Preparar Prompt Gemini').item.json;\n\nconst selfieBinMeta   = $('Descargar Selfie').item.binary?.selfie_bin;\nconst productoBinMeta = $('Descargar Producto').item.binary?.product_bin;\nif (!selfieBinMeta)   throw new Error('No se descargo la selfie');\nif (!productoBinMeta) throw new Error('No se descargo la imagen del producto');\n\nconst selfieBuffer   = await $getBinaryDataBuffer($('Descargar Selfie').item,   'selfie_bin');\nconst productoBuffer = await $getBinaryDataBuffer($('Descargar Producto').item, 'product_bin');\n\nconst selfieMime   = (selfieBinMeta.mimeType   || 'image/jpeg').split(';')[0].trim();\nconst productoMime = (productoBinMeta.mimeType  || 'image/jpeg').split(';')[0].trim();\nconst selfieB64   = selfieBuffer.toString('base64');\nconst productoB64 = productoBuffer.toString('base64');\n\nconst body = {\n  contents: [{\n    role: 'user',\n    parts: [\n      { text: d.full_prompt },\n      { inlineData: { mimeType: selfieMime,   data: selfieB64   } },\n      { inlineData: { mimeType: productoMime, data: productoB64 } }\n    ]\n  }],\n  generationConfig: {\n    temperature: 0.3,\n    maxOutputTokens: 8192,\n    responseModalities: ['IMAGE', 'TEXT']\n  }\n};\n\nreturn { json: {\n  brand_id:       d.brand_id,\n  product_id:     d.product_id,\n  selfie_url:     d.selfie_url,\n  timestamp:      d.timestamp,\n  timestamp_safe: d.timestamp_safe,\n  vertex_body:    JSON.stringify(body)\n}};"
            },
            "id": "4ba24914-1cc3-4306-b3f3-b4099e4f30bc",
            "name": "Preparar Body Vertex",
            "type": "n8n-nodes-base.code",
            "typeVersion": 2,
            "position": [26208, 4192]
        },
        {
            "parameters": {
                "method": "POST",
                "url": "https://us-central1-aiplatform.googleapis.com/v1/projects/gen-lang-client-0591001769/locations/us-central1/publishers/google/models/gemini-2.5-flash-image:generateContent",
                "authentication": "predefinedCredentialType",
                "nodeCredentialType": "googleApi",
                "sendBody": True,
                "contentType": "raw",
                "rawContentType": "application/json",
                "body": "={{ $json.vertex_body }}",
                "options": {
                    "timeout": 120000
                }
            },
            "id": "1c39cbb2-f486-4d19-a14b-c891d7ac0797",
            "name": "Generar con Vertex AI",
            "type": "n8n-nodes-base.httpRequest",
            "typeVersion": 4.2,
            "position": [26432, 4192],
            "credentials": {
                "googleApi": {
                    "id": "4PGapGVDlsYdbp6K",
                    "name": "Google Account"
                }
            }
        },
        {
            "parameters": {
                "jsCode": "const r = $input.item.json;\nconst prev = $('Preparar Body Vertex').item.json;\n\nif (!r.candidates || !r.candidates[0] || !r.candidates[0].content) {\n  throw new Error('Respuesta invalida de Vertex AI: ' + JSON.stringify(r).substring(0, 300));\n}\n\nconst msg = r.candidates[0].content;\nlet b64 = null;\nlet mimeType = 'image/jpeg';\n\nfor (const part of msg.parts) {\n  if (part.inlineData && part.inlineData.data) {\n    b64 = part.inlineData.data;\n    mimeType = part.inlineData.mimeType || 'image/jpeg';\n    break;\n  }\n  if (part.text && part.text.includes('base64,')) {\n    const m = part.text.match(/base64,([A-Za-z0-9+\\/=\\s]+)/s);\n    if (m) b64 = m[1];\n  }\n}\n\nif (!b64) throw new Error('No se encontro imagen en la respuesta de Vertex AI.');\nreturn { json: {\n  brand_id:               prev.brand_id,\n  product_id:             prev.product_id,\n  timestamp:              prev.timestamp,\n  timestamp_safe:         prev.timestamp_safe,\n  selfie_url:             prev.selfie_url,\n  generated_image_base64: b64.replace(/\\s+/g, ''),\n  generated_image_mime:   mimeType\n}};"
            },
            "id": "97c3eab7-c39a-4a2c-a279-60ec604c50a2",
            "name": "Extraer Imagen Base64",
            "type": "n8n-nodes-base.code",
            "typeVersion": 2,
            "position": [26640, 4192]
        },
        {
            "parameters": {
                "operation": "toFile",
                "options": {
                    "fileName": "result.jpeg",
                    "mimeType": "image/jpeg"
                },
                "sourceProperty": "generated_image_base64"
            },
            "id": "e41609c5-d920-489f-8fc2-a36dc9a2c7a3",
            "name": "Convert to File",
            "type": "n8n-nodes-base.convertToFile",
            "typeVersion": 1.1,
            "position": [26864, 4192]
        },
        {
            "parameters": {
                "method": "POST",
                "url": "https://api.lookitry.com/api/upload/selfie",
                "authentication": "genericCredentialType",
                "genericAuthType": "httpHeaderAuth",
                "sendHeaders": True,
                "headerParameters": {
                    "parameters": [
                        {
                            "name": "Autorizacion",
                            "value": "Beaver "
                        }
                    ]
                },
                "sendBody": True,
                "contentType": "multipart-form-data",
                "bodyParameters": {
                    "parameters": [
                        {
                            "parameterType": "formBinaryData",
                            "name": "file",
                            "inputDataFieldName": "data"
                        },
                        {
                            "name": "temporary",
                            "value": "false"
                        }
                    ]
                },
                "options": {
                    "timeout": 30000
                }
            },
            "id": "5d6b6c5a-b1bd-471e-ac38-a9a6e469a7f0",
            "name": "Subir Imagen Final",
            "type": "n8n-nodes-base.httpRequest",
            "typeVersion": 4.2,
            "position": [27088, 4192],
            "credentials": {
                "httpHeaderAuth": {
                    "id": "63r9snmc2rxxlWAn",
                    "name": "Lookitry API Token"
                }
            }
        },
        {
            "parameters": {
                "jsCode": "const selfie_url = $input.item.json.selfie_url;\nconst image_url = $input.item.json.url;\n\nconst match = selfie_url ? selfie_url.match(/images\\/(.+)$/) : null;\nconst path = match ? match[1] : null;\n\nif (!path) {\n  return { json: { skip_cleanup: true, image_url } };\n}\n\nreturn { json: { selfie_path: path, image_url } };"
            },
            "id": "c3579972-592e-44b5-829f-71bc781aa4f9",
            "name": "Extraer Path Selfie",
            "type": "n8n-nodes-base.code",
            "typeVersion": 2,
            "position": [27312, 4192]
        },
        {
            "parameters": {
                "method": "DELETE",
                "url": "https://api.lookitry.com/api/upload/cleanup-temp",
                "authentication": "genericCredentialType",
                "genericAuthType": "httpHeaderAuth",
                "sendHeaders": True,
                "headerParameters": {
                    "parameters": [
                        {
                            "name": "Content-Type",
                            "value": "application/json"
                        },
                        {
                            "name": "Authorization",
                            "value": "Bearer [USAR_CREDENCIAL]"
                        }
                    ]
                },
                "sendBody": True,
                "specifyBody": "json",
                "jsonBody": "={{ { selfie_paths: [$json.selfie_path] } }}",
                "options": {
                    "timeout": 10000
                }
            },
            "id": "fa4b891f-0887-4e29-a950-ce1e6976a6f8",
            "name": "Eliminar Selfie Temporal",
            "type": "n8n-nodes-base.httpRequest",
            "typeVersion": 4.2,
            "position": [27520, 4192],
            "credentials": {
                "httpHeaderAuth": {
                    "id": "63r9snmc2rxxlWAn",
                    "name": "Lookitry API Token"
                }
            }
        },
        {
            "parameters": {
                "assignments": {
                    "assignments": [
                        {
                            "id": "field-image-url",
                            "name": "image_url",
                            "value": "={{ $('Extraer Path Selfie').item.json.image_url }}",
                            "type": "string"
                        },
                        {
                            "id": "field-model",
                            "name": "_meta_model",
                            "value": "gemini-2.5-flash",
                            "type": "string"
                        },
                        {
                            "id": "field-execution",
                            "name": "_meta_execution_id",
                            "value": "={{ $execution.id }}",
                            "type": "string"
                        },
                        {
                            "id": "field-timestamp",
                            "name": "_meta_timestamp",
                            "value": "={{ new Date().toISOString() }}",
                            "type": "string"
                        }
                    ]
                },
                "options": {}
            },
            "id": "826ba827-a2e1-487c-8fba-c817e28dfe03",
            "name": "Preparar Respuesta",
            "type": "n8n-nodes-base.set",
            "typeVersion": 3.4,
            "position": [27744, 4192]
        },
        {
            "parameters": {
                "respondWith": "json",
                "responseBody": "={{ { success: true, imageUrl: $json.image_url, _meta: { model: $json._meta_model, executionId: $json._meta_execution_id, generatedAt: $json._meta_timestamp } } }}",
                "options": {
                    "responseCode": 200,
                    "responseHeaders": {
                        "entries": [
                            {
                                "name": "Content-Type",
                                "value": "application/json"
                            }
                        ]
                    }
                }
            },
            "id": "548935ec-817b-4d9b-89ac-d3c5f906a2ac",
            "name": "Responder Exito",
            "type": "n8n-nodes-base.respondToWebhook",
            "typeVersion": 1.1,
            "position": [27968, 4192]
        }
    ],
    "connections": {
        "Webhook": {
            "main": [
                [
                    {
                        "node": "Validar Input",
                        "type": "main",
                        "index": 0
                    }
                ]
            ]
        },
        "Validar Input": {
            "main": [
                [
                    {
                        "node": "Preparar Prompt Gemini",
                        "type": "main",
                        "index": 0
                    }
                ]
            ]
        },
        "Preparar Prompt Gemini": {
            "main": [
                [
                    {
                        "node": "Descargar Selfie",
                        "type": "main",
                        "index": 0
                    }
                ]
            ]
        },
        "Descargar Selfie": {
            "main": [
                [
                    {
                        "node": "Descargar Producto",
                        "type": "main",
                        "index": 0
                    }
                ]
            ]
        },
        "Descargar Producto": {
            "main": [
                [
                    {
                        "node": "Preparar Body Vertex",
                        "type": "main",
                        "index": 0
                    }
                ]
            ]
        },
        "Preparar Body Vertex": {
            "main": [
                [
                    {
                        "node": "Generar con Vertex AI",
                        "type": "main",
                        "index": 0
                    }
                ]
            ]
        },
        "Generar con Vertex AI": {
            "main": [
                [
                    {
                        "node": "Extraer Imagen Base64",
                        "type": "main",
                        "index": 0
                    }
                ]
            ]
        },
        "Extraer Imagen Base64": {
            "main": [
                [
                    {
                        "node": "Convert to File",
                        "type": "main",
                        "index": 0
                    }
                ]
            ]
        },
        "Convert to File": {
            "main": [
                [
                    {
                        "node": "Subir Imagen Final",
                        "type": "main",
                        "index": 0
                    }
                ]
            ]
        },
        "Subir Imagen Final": {
            "main": [
                [
                    {
                        "node": "Extraer Path Selfie",
                        "type": "main",
                        "index": 0
                    }
                ]
            ]
        },
        "Extraer Path Selfie": {
            "main": [
                [
                    {
                        "node": "Eliminar Selfie Temporal",
                        "type": "main",
                        "index": 0
                    }
                ]
            ]
        },
        "Eliminar Selfie Temporal": {
            "main": [
                [
                    {
                        "node": "Preparar Respuesta",
                        "type": "main",
                        "index": 0
                    }
                ]
            ]
        },
        "Preparar Respuesta": {
            "main": [
                [
                    {
                        "node": "Responder Exito",
                        "type": "main",
                        "index": 0
                    }
                ]
            ]
        }
    },
    "settings": {},
    "staticData": None
}

response = requests.put(url, json=payload, headers=headers)
print(f'Status: {response.status_code}')
if response.status_code == 200:
    data = response.json()
    print(f'Workflow updated: {data.get("name")}')
    print(f'Nodes count: {len(data.get("nodes", []))}')
    # Verify the Vertex AI node has the correct URL
    for node in data.get('nodes', []):
        if node.get('name') == 'Generar con Vertex AI':
            print(f'Vertex AI URL: {node.get("parameters", {}).get("url")}')
else:
    print(f'Response: {response.text}')
