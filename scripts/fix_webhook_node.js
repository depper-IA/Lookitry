/**
 * Fix específico para el nodo Webhook Trigger Manual
 * que perdió sus parameters en el update anterior
 */

const https = require('https');

const N8N_BASE = 'https://n8n.wilkiedevs.com';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NGUxZTYyYi1kY2M0LTRiZGUtOWFjZS02OTBmMjAxMGIyMDAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiMTZlYTg4NzktNzdjNy00YjIzLWExOGEtYTdiNTUyMWVmYjQ3IiwiaWF0IjoxNzc1NjE2NDExfQ.um2S_fEt0EDpvBn9T_Z59AcQqvCb0iA3qxA1Qrjy1mE';
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
        console.log(`API ${method} ${path} -> ${res.statusCode}`);
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  // First, get current workflow to find the webhook node index
  console.log('1. Obteniendo workflow actual...');
  const current = await apiRequest('GET', `/rest/workflows/${WORKFLOW_ID}`);
  
  if (current.status !== 200) {
    console.log('Error获取workflow:', current.data);
    return;
  }

  const workflow = current.data.data;
  console.log(`   Workflow: "${workflow.name}" (${workflow.nodes.length} nodos)`);

  // Find the webhook node
  const webhookNodeIndex = workflow.nodes.findIndex(n => n.name === 'Webhook Trigger Manual');
  if (webhookNodeIndex === -1) {
    console.log('ERROR: No encontré el nodo Webhook Trigger Manual');
    return;
  }

  const webhookNode = workflow.nodes[webhookNodeIndex];
  console.log(`   Webhook node encontrado en índice ${webhookNodeIndex}`);
  console.log(`   Parámetros actuales:`, JSON.stringify(webhookNode.parameters));

  // Fix the parameters
  webhookNode.parameters = {
    httpMethod: 'POST',
    path: 'trigger-blog-generation',
    options: {}
  };
  webhookNode.webhookId = 'lookitry-blog-trigger-v3';

  console.log('\n2. Parámetros corregidos:');
  console.log(`   httpMethod: POST`);
  console.log(`   path: trigger-blog-generation`);
  console.log(`   webhookId: lookitry-blog-trigger-v3`);

  // Build the update payload - ONLY update the nodes array with the fixed webhook
  const updatePayload = {
    name: workflow.name,
    nodes: workflow.nodes,
    connections: workflow.connections,
    settings: workflow.settings,
    staticData: workflow.staticData,
    tags: workflow.tags,
    active: workflow.active,
  };

  // Remove fields that shouldn't be in PUT
  delete updatePayload.id;
  delete updatePayload.createdAt;
  delete updatePayload.updatedAt;
  delete updatePayload.isArchived;

  console.log('\n3. Intentando PUT /rest/workflows/${WORKFLOW_ID}...');
  const updateResult = await apiRequest('PUT', `/rest/workflows/${WORKFLOW_ID}`, updatePayload);
  
  console.log('   Status:', updateResult.status);
  if (updateResult.status === 200 || updateResult.status === 201) {
    console.log('✅ Workflow actualizado exitosamente!');
  } else {
    console.log('   Respuesta:', JSON.stringify(updateResult.data).substring(0, 500));
  }
}

main().catch(console.error);
