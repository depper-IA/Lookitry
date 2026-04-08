/**
 * Script para fix del workflow de blog de n8n
 * 1. Descarga el workflow completo
 * 2. Modifica los nodos necesarios para eliminar uso de OpenRouter en imágenes de blog
 * 3. Sube el workflow modificado
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const N8N_BASE = 'https://n8n.wilkiedevs.com';
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
  console.log('📥 Descargando workflow...');
  const workflow = await apiRequest('GET', `/rest/workflows/${WORKFLOW_ID}`);

  if (workflow.status === 'error') {
    console.error('❌ Error:', workflow.message);
    console.log('Response:', JSON.stringify(workflow));
    return;
  }

  console.log(`✅ Workflow descargado: "${workflow.data.name}"`);
  console.log(`   Nodes: ${workflow.data.nodes?.length}`);

  // ============================================================
  // FIX 1: Cambiar el default de image_provider de 'openrouter' a 'replicate'
  // en el nodo "Extraer Prompts"
  // ============================================================
  const extraerPromptsNode = workflow.data.nodes.find(n => n.name === 'Extraer Prompts');
  if (extraerPromptsNode) {
    const oldCode = `const requestedProvider     = String(webhookPayload.image_provider      || 'openrouter').toLowerCase();`;
    const newCode = `const requestedProvider     = String(webhookPayload.image_provider      || 'replicate').toLowerCase();`;

    if (extraerPromptsNode.parameters.jsCode.includes(oldCode)) {
      extraerPromptsNode.parameters.jsCode = extraerPromptsNode.parameters.jsCode.replace(
        oldCode,
        newCode
      );
      console.log('✅ FIX 1 aplicado: Extraer Prompts ahora usa replicate por defecto');
    } else {
      // Try to find and replace the default value in the code
      const code = extraerPromptsNode.parameters.jsCode;
      if (code.includes("'openrouter'") && code.includes("image_provider")) {
        extraerPromptsNode.parameters.jsCode = code.replace(
          /image_provider\s*\|\|\s*'openrouter'/g,
          "image_provider      || 'replicate'"
        );
        console.log('✅ FIX 1 aplicado (regex): Extraer Prompts ahora usa replicate por defecto');
      } else {
        console.log('⚠️ FIX 1 no pudo ser aplicado - código puede haber cambiado ya');
        console.log('   Buscando openrouter en el código...');
        if (code.includes('openrouter')) {
          console.log('   openrouter encontrado en posición:', code.indexOf('openrouter'));
        }
      }
    }

    // Also force image_provider to 'replicate' in the sharedMeta
    const oldMeta = `image_provider:       requestedProvider,`;
    const newMeta = `image_provider:       'replicate', // FORZADO: blog solo usa Replicate, NO OpenRouter`;
    if (extraerPromptsNode.parameters.jsCode.includes(oldMeta)) {
      extraerPromptsNode.parameters.jsCode = extraerPromptsNode.parameters.jsCode.replace(
        oldMeta,
        newMeta
      );
      console.log('✅ FIX 1b aplicado: sharedMeta image_provider forzado a replicate');
    }
  } else {
    console.log('⚠️ Nodo Extraer Prompts no encontrado');
  }

  // ============================================================
  // FIX 2: En "Switch Proveedor Imagen", conectar AMBOS outputs a Replicate FLUX
  // así aunque algo decida ir por output 1 (openrouter), termina en Replicate
  // ============================================================
  const switchNode = workflow.data.nodes.find(n => n.name === 'Switch Proveedor Imagen');
  if (switchNode) {
    // Both outputs should go to Replicate FLUX
    const replicateNode = workflow.data.nodes.find(n => n.name === 'Replicate FLUX');
    if (replicateNode) {
      const replicatePosition = replicateNode.position;
      const switchPosition = switchNode.position;

      workflow.data.connections['Switch Proveedor Imagen'] = {
        main: [
          [{ node: 'Replicate FLUX', type: 'main', index: 0 }],
          [{ node: 'Replicate FLUX', type: 'main', index: 0 }]
        ]
      };
      console.log('✅ FIX 2 aplicado: Ambos outputs del Switch van a Replicate FLUX');
    }
  } else {
    console.log('⚠️ Nodo Switch Proveedor Imagen no encontrado');
  }

  // ============================================================
  // FIX 3: Desactivar el nodo OpenRouter Generar Imagen
  // (cambiar a inactive o eliminar conexión)
  // ============================================================
  // We'll just leave it - with both switch outputs going to Replicate, OpenRouter won't be called

  // ============================================================
  // FIX 4: Asegurar que el Webhook trigger conecta a GET Temas Pendientes
  // para que se consuman los topics pendientes
  // ============================================================
  // Current: Webhook -> Google Noticias Colombia
  // Needed: Webhook -> Google Noticias Colombia Y Webhook -> GET Temas Pendientes
  //
  // Since a node can only have one output connection, we need to use a different approach.
  // The simplest: Add a Code node after Webhook that sends to both branches.
  // Or: Change the flow so Schedule Trigger is the main trigger and Webhook is a secondary trigger.

  // For now, let's document this issue and add a Code node after Webhook to fork the signal
  const webhookNode = workflow.data.nodes.find(n => n.name === 'Webhook Trigger Manual');
  const getTemasPendientes = workflow.data.nodes.find(n => n.name === 'GET Temas Pendientes');
  const prepararLoopTemas = workflow.data.nodes.find(n => n.name === 'Preparar Loop Temas');

  if (webhookNode && getTemasPendientes && prepararLoopTemas) {
    // Add a Code node that duplicates the webhook output to trigger both branches
    const forkNode = {
      parameters: {
        jsCode: `// Fork node: envía el trigger a ambas ramas\n// Rama izquierda: Google Noticias (generación de topics)\n// Rama derecha: GET Temas Pendientes (loop de artículos)\n// Esto asegura que cuando se dispara el webhook, se procesen los topics pendientes\nconst trigger = $input.first()?.json || {};\nreturn [{ json: { ...trigger, __fork__: true } }];`
      },
      id: 'fork-trigger-' + Date.now(),
      name: 'Fork Trigger a Ambas Ramas',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [91008, 35856]
    };

    // Insert fork node after Webhook
    workflow.data.nodes.push(forkNode);

    // Update Webhook connection to go to Fork node
    workflow.data.connections['Webhook Trigger Manual'] = {
      main: [[{ node: 'Fork Trigger a Ambas Ramas', type: 'main', index: 0 }]]
    };

    // Fork node connects to Google Noticias (left branch) AND to GET Temas Pendientes via Preparar Loop Temas (right branch)
    workflow.data.connections['Fork Trigger a Ambas Ramas'] = {
      main: [
        [{ node: 'Google Noticias Colombia', type: 'main', index: 0 }],
        [{ node: 'Preparar Loop Temas', type: 'main', index: 0 }]
      ]
    };

    console.log('✅ FIX 4 aplicado: Fork node permite que Webhook active ambas ramas');
  } else {
    console.log('⚠️ No se pudo aplicar FIX 4 - nodos no encontrados');
    if (!webhookNode) console.log('   - Webhook Trigger Manual no encontrado');
    if (!getTemasPendientes) console.log('   - GET Temas Pendientes no encontrado');
    if (!prepararLoopTemas) console.log('   - Preparar Loop Temas no encontrado');
  }

  // Save modified workflow to file
  const outputPath = path.join(__dirname, 'workflow_blog_modified.json');
  fs.writeFileSync(outputPath, JSON.stringify(workflow.data, null, 2));
  console.log(`\n💾 Workflow modificado guardado en: ${outputPath}`);
  console.log(`   Tamaño: ${fs.statSync(outputPath).size} bytes`);

  // ============================================================
  // Upload the modified workflow
  // ============================================================
  console.log('\n📤 Subiendo workflow modificado...');

  // Remove fields that shouldn't be in the PUT body
  const { id, createdAt, updatedAt, ...putBody } = workflow.data;

  const result = await apiRequest('PUT', `/rest/workflows/${WORKFLOW_ID}`, {
    ...putBody,
    name: putBody.name || 'Lookitry Blog Automation v5'
  });

  if (result.data) {
    console.log('✅ Workflow actualizado exitosamente!');
    console.log(`   ID: ${result.data.id}`);
    console.log(`   Nombre: ${result.data.name}`);
  } else {
    console.log('⚠️ Respuesta del servidor:', JSON.stringify(result).substring(0, 500));
  }
}

main().catch(console.error);
