/**
 * Upload workflow to n8n using REST API
 */

const https = require('https');
const fs = require('fs');

const N8N_BASE = 'https://n8n.wilkiedevs.com';
// Using the new API key provided by user
const N8N_API_KEY = '***REMOVED-SECRET***';
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
  console.log('Reading workflow file...');
  const workflowData = JSON.parse(fs.readFileSync('./workflow_blog_fixed.json', 'utf8'));
  console.log(`Loaded workflow: "${workflowData.name}" with ${workflowData.nodes.length} nodes`);

  // Check webhook node
  const webhookNode = workflowData.nodes.find(n => n.name === 'Webhook Trigger Manual');
  if (webhookNode) {
    console.log(`Webhook params:`, JSON.stringify(webhookNode.parameters));
  } else {
    console.log('ERROR: Webhook node not found!');
  }

  // Remove read-only fields
  delete workflowData.id;
  delete workflowData.createdAt;
  delete workflowData.updatedAt;
  delete workflowData.isArchived;

  console.log(`\nUpdating workflow ${WORKFLOW_ID}...`);
  const result = await apiRequest('PATCH', `/rest/workflows/${WORKFLOW_ID}`, workflowData);

  console.log(`Status: ${result.status}`);
  if (result.status === 200 || result.status === 201) {
    console.log('✅ SUCCESS! Workflow updated');
  } else {
    console.log('❌ FAILED:', JSON.stringify(result.data).substring(0, 500));
  }
}

main().catch(console.error);
