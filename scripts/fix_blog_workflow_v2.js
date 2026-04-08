/**
 * Script para fix del workflow de blog de n8n
 * Usa el archivo JSON del workflow guardado localmente
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const N8N_BASE = 'https://n8n.wilkiedevs.com';
// Token from backend .env - n8n API key
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NGUxZTYyYi1kY2M0LTRiZGUtOWFjZS02OTBmMjAxMGIyMDAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiZWE2NmI1N2ItNTBiNS00ZTViLWJhYzYtZDE2MWFkM2NkZTkzIiwiaWF0IjoxNzczMjc5MzMyfQ.ZuYsz4K4ifpp9ho_nZzpDypTy49_APNx9hkecKridJw';
const WORKFLOW_ID = 'VMAu93Zx4k5qgzdm';

function apiRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, N8N_BASE);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: method,
      headers: {
        'Authorization': `Bearer ${N8N_API_KEY}`,
        'Content-Type': 'application/json',
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(data);
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  // Find the workflow JSON file from the MCP tool output
  const toolOutputDir = 'C:/Users/Matt/.local/share/opencode/tool-output/';
  const files = fs.readdirSync(toolOutputDir);

  let workflowFile = null;
  for (const file of files) {
    if (file.startsWith('tool_d6a8c7') && file.endsWith('q')) {
      const fullPath = path.join(toolOutputDir, file);
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('"id":"VMAu93Zx4k5qgzdm"') || content.includes('"Lookitry Blog Automation v5"')) {
        workflowFile = fullPath;
        console.log(`✅ Found workflow file: ${file}`);
        break;
      }
    }
  }

  if (!workflowFile) {
    // Try alternate approach - find by size
    for (const file of files) {
      const fullPath = path.join(toolOutputDir, file);
      const stats = fs.statSync(fullPath);
      if (stats.size > 100000) { // Large file = likely workflow
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes('VMAu93Zx4k5qgzdm') || content.includes('Lookitry Blog')) {
          workflowFile = fullPath;
          console.log(`✅ Found workflow file by size: ${file} (${stats.size} bytes)`);
          break;
        }
      }
    }
  }

  if (!workflowFile) {
    console.error('❌ Could not find workflow JSON file');
    console.log('Available files:', files.filter(f => f.includes('d6a8c7')));
    return;
  }

  let workflowContent = fs.readFileSync(workflowFile, 'utf8');

  // The file might be wrapped in {"data":[...]} from MCP tool response
  let workflow;
  try {
    const parsed = JSON.parse(workflowContent);
    if (parsed.data && Array.isArray(parsed.data)) {
      workflow = parsed.data[0];
      console.log('✅ Parsed workflow from MCP response wrapper');
    } else if (parsed.id === WORKFLOW_ID || parsed.name === 'Lookitry Blog Automation v5') {
      workflow = parsed;
      console.log('✅ Parsed workflow directly');
    } else {
      console.error('❌ Unexpected JSON structure');
      console.log('Keys:', Object.keys(parsed));
      return;
    }
  } catch (e) {
    console.error('❌ Failed to parse workflow JSON:', e.message);
    return;
  }

  console.log(`\nWorkflow: "${workflow.name}" (ID: ${workflow.id})`);
  console.log(`Nodes: ${workflow.nodes?.length}`);

  // ============================================================
  // FIX 1: Cambiar default de image_provider de 'openrouter' a 'replicate'
  // en el nodo "Extraer Prompts"
  // ============================================================
  const extraerPromptsNode = workflow.nodes.find(n => n.name === 'Extraer Prompts');
  if (extraerPromptsNode && extraerPromptsNode.parameters.jsCode) {
    const oldCode1 = "image_provider      || 'openrouter'";
    const newCode1 = "image_provider      || 'replicate'";

    if (extraerPromptsNode.parameters.jsCode.includes(oldCode1)) {
      extraerPromptsNode.parameters.jsCode = extraerPromptsNode.parameters.jsCode.replace(
        oldCode1, newCode1
      );
      console.log('✅ FIX 1a: Cambiado default image_provider a replicate');
    }

    // Also force image_provider to 'replicate' in sharedMeta (ignore webhookPayload value)
    const oldCode2 = "image_provider:       requestedProvider,";
    const newCode2 = "image_provider:       'replicate', // FORZADO: blog solo usa Replicate, NO OpenRouter";

    if (extraerPromptsNode.parameters.jsCode.includes(oldCode2)) {
      extraerPromptsNode.parameters.jsCode = extraerPromptsNode.parameters.jsCode.replace(
        oldCode2, newCode2
      );
      console.log('✅ FIX 1b: image_provider forzado a replicate en sharedMeta');
    } else if (extraerPromptsNode.parameters.jsCode.includes("image_provider:       'replicate'")) {
      console.log('✅ FIX 1b: image_provider ya está forzado a replicate');
    }
  } else {
    console.log('⚠️ Nodo Extraer Prompts no encontrado o sin jsCode');
  }

  // ============================================================
  // FIX 2: En "Switch Proveedor Imagen", ambos outputs van a Replicate FLUX
  // (así aunque algo vaya por output 1, termina en Replicate)
  // ============================================================
  if (workflow.connections['Switch Proveedor Imagen']) {
    const hasReplicateConnection = workflow.connections['Switch Proveedor Imagen'].main[0]
      ?.some(c => c.node === 'Replicate FLUX');
    const hasOpenRouterConnection = workflow.connections['Switch Proveedor Imagen'].main[1]
      ?.some(c => c.node === 'OpenRouter Generar Imagen');

    // Set BOTH outputs to Replicate FLUX
    workflow.connections['Switch Proveedor Imagen'].main = [
      [{ node: 'Replicate FLUX', type: 'main', index: 0 }],
      [{ node: 'Replicate FLUX', type: 'main', index: 0 }]
    ];
    console.log('✅ FIX 2: Ambos outputs del Switch van a Replicate FLUX');

    if (hasOpenRouterConnection) {
      console.log('   (OpenRouter Generar Imagen desconectado del flujo principal)');
    }
  }

  // ============================================================
  // FIX 3: Webhook trigger debe activar AMBAS ramas
  // Crear un nodo Fork que duplique la señal
  // ============================================================
  // Current: Webhook -> Google Noticias Colombia
  // Needed: Webhook -> Fork -> (Google Noticias Colombia + Preparar Loop Temas)

  // Check if Fork node already exists
  let forkNode = workflow.nodes.find(n => n.name === 'Fork Trigger a Ambas Ramas');

  if (!forkNode) {
    // Add Fork node
    forkNode = {
      parameters: {
        jsCode: `// Fork node: envía el trigger a ambas ramas\n// Rama izquierda: Google Noticias Colombia (generación de topics)\n// Rama derecha: Preparar Loop Temas (loop de artículos)\n// Esto asegura que cuando se dispara el webhook, se procesen los topics pendientes\nconst trigger = $input.first()?.json || {};\nreturn [{ json: { ...trigger, __fork__: true } }];`
      },
      id: 'fork-trigger-' + Date.now(),
      name: 'Fork Trigger a Ambas Ramas',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [91008, 35856]
    };
    workflow.nodes.push(forkNode);
    console.log('✅ FIX 3: Nodo Fork creado');
  }

  // Update connections:
  // Webhook -> Fork (instead of directly to Google Noticias)
  workflow.connections['Webhook Trigger Manual'] = {
    main: [[{ node: 'Fork Trigger a Ambas Ramas', type: 'main', index: 0 }]]
  };

  // Fork -> Google Noticias AND Fork -> Preparar Loop Temas
  workflow.connections['Fork Trigger a Ambas Ramas'] = {
    main: [
      [{ node: 'Google Noticias Colombia', type: 'main', index: 0 }],
      [{ node: 'Preparar Loop Temas', type: 'main', index: 0 }]
    ]
  };

  console.log('✅ FIX 3: Webhook ahora activa ambas ramas (Fork -> Google Noticias + Fork -> Preparar Loop Temas)');

  // Save modified workflow to file
  const outputPath = path.join(__dirname, 'workflow_blog_fixed.json');
  fs.writeFileSync(outputPath, JSON.stringify(workflow, null, 2));
  console.log(`\n💾 Workflow modificado guardado en: ${outputPath}`);
  console.log(`   Tamaño: ${fs.statSync(outputPath).size} bytes`);

  // ============================================================
  // Upload to n8n
  // ============================================================
  console.log('\n📤 Subiendo workflow a n8n...');

  // Remove fields that shouldn't be in PUT
  const { id, createdAt, updatedAt, isArchived, ...putBody } = workflow;

  try {
    // Try PATCH first (n8n uses PATCH for workflow updates)
    let result = await apiRequest('PATCH', `/rest/workflows/${WORKFLOW_ID}`, {
      ...putBody,
      name: putBody.name || 'Lookitry Blog Automation v5'
    });

    if (result.status === 'error' || result.message?.includes('Unauthorized')) {
      console.log('   PATCH failed, trying POST...');
      // Try POST with ID in body
      result = await apiRequest('POST', `/rest/workflows/${WORKFLOW_ID}`, {
        ...putBody,
        id: WORKFLOW_ID,
        name: putBody.name || 'Lookitry Blog Automation v5'
      });
    }

    if (result && typeof result === 'object') {
      if (result.data) {
        console.log('✅ Workflow actualizado exitosamente!');
        console.log(`   ID: ${result.data.id}`);
        console.log(`   Nombre: ${result.data.name}`);
      } else if (result.status === 'error') {
        console.log('❌ Error del servidor:', result.message);
        console.log('   Hint: Es posible que las credenciales de API de n8n hayan expirado.');
        console.log('   Usa el panel de n8n para importar el archivo:', outputPath);
      } else {
        console.log('⚠️ Respuesta:', JSON.stringify(result).substring(0, 300));
      }
    } else {
      console.log('⚠️ Respuesta no-JSON:', String(result).substring(0, 300));
    }
  } catch (e) {
    console.error('❌ Error al subir workflow:', e.message);
    console.log('\n💡 El archivo modificado está guardado en:', outputPath);
    console.log('   Puedes importarlo manualmente en n8n:');
    console.log('   1. Ve a https://n8n.wilkiedevs.com');
    console.log('   2. Abre el workflow "Lookitry Blog Automation v5"');
    console.log('   3. Usa Importar desde archivo JSON');
  }
}

main().catch(console.error);
