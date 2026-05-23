const fs = require('fs');

const jsCode = `const payload = $input.first()?.json || {};
const input = payload.body || payload;
const topic_id = String(input.topic_id || '');
const title = input.title || '';
const keywords = input.keywords || '';
const category = input.category_slug || 'moda';
const research = input.research_context || '';

const debugLogs = [];
function logAction(msg) {
  debugLogs.push(msg);
}
logAction('Inicio ejecucion para: ' + title);

const categoryContext = {
  'ecommerce': 'online shopping, ecommerce platform, digital retail',
  'ia': 'artificial intelligence, AI technology, machine learning',
  'moda-y-estilo': 'fashion, clothing style, outfit trends, boutique fashion',
  'negocios-y-saas': 'business strategy, SaaS software, entrepreneurship'
};

const context = categoryContext[category] || categoryContext['moda-y-estilo'];
const researchSummary = research.substring(0, 500);

const prompts = [
  {
    prompt: 'Professional fashion photography featuring ' + title + '. ' + context + '. Colombian ecommerce retail setting. Warm studio lighting with natural accents. Editorial style for online fashion store. 16:9 aspect ratio, commercial photography quality.',
    tipo: 'hero',
    aspect_ratio: '16:9'
  },
  {
    prompt: 'Lifestyle editorial photography showing ' + title + ' in a real Colombian boutique environment. ' + researchSummary.substring(0, 200) + '. Natural lighting, candid retail moment, authentic fashion experience. 16:9 aspect ratio.',
    tipo: 'body1',
    aspect_ratio: '16:9'
  },
  {
    prompt: 'Detail-oriented fashion photography focusing on ' + title + '. Close-up of garment texture, fabric quality, and design details. ' + context + '. Colombian fashion retail aesthetic. Professional product photography, minimal background. 16:9 aspect ratio.',
    tipo: 'body2',
    aspect_ratio: '16:9'
  }
];

const replicateToken = 'r8_D4VY9Ay3avB9k5qMARUTqD09qIaiTne3TKVu0';
const blogSecret = 'Travis2305**_blog_n8n';
const uploadUrl = 'https://api.lookitry.com/api/blog/upload';

// Hack para hacer sleep sin usar setTimeout (que a veces se cuelga en n8n)
async function sleepFallback(seconds) {
  try {
    logAction('SleepFallback (' + seconds + 's) usando httpbin...');
    await this.helpers.request({
      method: 'GET',
      url: 'https://httpbin.org/delay/' + seconds,
      timeout: (seconds + 5) * 1000
    });
  } catch (e) {
    logAction('Sleep fallback errored: ' + e.message);
  }
}

async function startReplicateTask(promptText, aspectRatio) {
  try {
    logAction('Enviando request a Replicate (sincrono)...');
    const result = await this.helpers.request({
      method: 'POST',
      url: 'https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions',
      headers: {
        'Authorization': 'Bearer ' + replicateToken,
        'Content-Type': 'application/json',
        'Prefer': 'wait=60'
      },
      body: {
        input: {
          prompt: promptText,
          aspect_ratio: aspectRatio || '16:9',
          output_format: 'png',
          output_quality: 90,
          num_inference_steps: 4,
          go_fast: true,
          megapixels: "1"
        }
      },
      json: true
    });
    logAction('Respuesta START Replicate ok: ID=' + result.id + ', status=' + result.status);
    return result;
  } catch (err) {
    logAction('Error en startReplicateTask: ' + err.message);
    throw err;
  }
}

async function pollReplicate(pollUrl) {
  return await this.helpers.request({
    method: 'GET',
    url: pollUrl,
    headers: { Authorization: 'Bearer ' + replicateToken },
    json: true
  });
}

async function resolveImageUrl(pred, tipo) {
  if (!pred || !pred.id) {
    logAction(tipo + ': No prediction ID en respuesta');
    return '';
  }
  if (pred.status === 'succeeded' && pred.output) {
    logAction(tipo + ': Terminado directo en la primera peticion!');
    return String(Array.isArray(pred.output) ? pred.output[0] : pred.output);
  }
  if (pred.status === 'failed' || pred.status === 'canceled') {
    logAction(tipo + ': Fallo en replicate status=' + pred.status);
    return '';
  }
  
  const pollUrl = pred.urls && pred.urls.get;
  if (!pollUrl) {
    logAction(tipo + ': Falta URL de polling');
    return '';
  }
  
  logAction(tipo + ': Iniciando polling en ' + pollUrl);
  for (let i = 0; i < 5; i++) {
    await sleepFallback(5);
    const cur = await pollReplicate(pollUrl);
    if (cur.status === 'succeeded' && cur.output) {
      logAction(tipo + ': Polling Succeeded despues de intentos ' + (i+1));
      return String(Array.isArray(cur.output) ? cur.output[0] : cur.output);
    }
    if (cur.error || cur.status === 'failed' || cur.status === 'canceled') {
      logAction(tipo + ': Polling failed con status ' + cur.status);
      return '';
    }
  }
  logAction(tipo + ': Polling timeout alcanzado');
  return '';
}

async function downloadAndUpload(imageUrl, filename, tipo) {
  logAction(tipo + ': Descargando de Replicate URL: ' + imageUrl);
  let bufferResponse;
  try {
    bufferResponse = await this.helpers.request({
      method: 'GET',
      url: imageUrl,
      encoding: null,
      responseType: 'arraybuffer'
    });
  } catch (err) {
    throw new Error('Download fallo: ' + err.message);
  }
  
  const buffer = Buffer.from(bufferResponse);
  if (!buffer || buffer.length === 0) {
    throw new Error('Buffer descargado esta vacio');
  }
  logAction(tipo + ': Descarga exitosa (' + buffer.length + ' bytes)');

  logAction(tipo + ': Subiendo a MinIO...');
  const boundary = '----n8nboundary' + Date.now();
  const CRLF = '\\r\\n';
  
  const bodyParts = [];
  bodyParts.push(
    '--' + boundary + CRLF +
    'Content-Disposition: form-data; name="file"; filename="' + filename + '"' + CRLF +
    'Content-Type: image/png' + CRLF + CRLF
  );
  bodyParts.push(buffer);
  bodyParts.push(CRLF);
  bodyParts.push(
    '--' + boundary + CRLF +
    'Content-Disposition: form-data; name="asset_type"' + CRLF + CRLF +
    'blog-inline' + CRLF
  );
  bodyParts.push(
    '--' + boundary + CRLF +
    'Content-Disposition: form-data; name="filename"' + CRLF + CRLF +
    filename + CRLF
  );
  bodyParts.push('--' + boundary + '--' + CRLF);
  
  const body = Buffer.concat(bodyParts.map(p => Buffer.isBuffer(p) ? p : Buffer.from(p)));

  const upResStr = await this.helpers.request({
    method: 'POST',
    url: uploadUrl,
    headers: {
      'x-blog-secret': blogSecret,
      'Content-Type': 'multipart/form-data; boundary=' + boundary,
      'Content-Length': String(body.length)
    },
    body: body,
    encoding: 'utf8'
  });

  logAction(tipo + ': Respuesta upload completada.');
  
  let upJson;
  try { upJson = (typeof upResStr === 'string') ? JSON.parse(upResStr) : upResStr; } catch(e) { upJson = {}; }
  if (upJson && upJson.error) {
    throw new Error('Upload error json: ' + JSON.stringify(upJson));
  }
  return {
    url: String(upJson.url || upJson.imageUrl || ''),
    path: String(upJson.path || upJson.key || '')
  };
}

let byType = {};
let totalOk = 0;

try {
  for (let i = 0; i < prompts.length; i++) {
    const p = prompts[i];
    const filename = topic_id + '-' + p.tipo + '-' + Date.now() + '.png';
    let url = '';
    let path = '';
    try {
      logAction('>>> Procesando ' + p.tipo + ' <<<');
      const pred = await startReplicateTask(p.prompt, p.aspect_ratio);
      const imageUrl = await resolveImageUrl(pred, p.tipo);
      if (imageUrl) {
        const uploaded = await downloadAndUpload(imageUrl, filename, p.tipo);
        url = uploaded.url;
        path = uploaded.path;
        totalOk++;
        logAction(p.tipo + ' COMLETADO EXITOSAMENTE');
      } else {
        logAction(p.tipo + ' FALLO: No se obtuvo resolucion de imageUrl');
      }
    } catch (err) {
      logAction('EXCEPCION en ' + p.tipo + ': ' + String(err));
    }
    
    byType[p.tipo] = { url, path };
    
    if (i < prompts.length - 1) {
      await sleepFallback(12);
    }
  }
} catch (megaErr) {
  logAction('ERROR GIGANTE FATAL EN BUCLE: ' + String(megaErr));
}

return [{
  json: {
    topic_id: topic_id,
    title: title,
    imagenes_ok: totalOk,
    imagen_hero_url:  byType.hero  ? byType.hero.url   : '',
    imagen_hero_id:   byType.hero  ? byType.hero.path  : null,
    imagen_body1_url: byType.body1 ? byType.body1.url  : '',
    imagen_body1_id:  byType.body1 ? byType.body1.path : null,
    imagen_body2_url: byType.body2 ? byType.body2.url  : '',
    imagen_body2_id:  byType.body2 ? byType.body2.path : null,
    _debugLogs: debugLogs
  }
}];
`;

const data = JSON.parse(fs.readFileSync('./scripts/workflow_image_generator_v2.json', 'utf8'));
const nodeIndex = data.nodes.findIndex(n => n.name === 'Generar y Subir Imagenes');
data.nodes[nodeIndex].parameters.jsCode = jsCode;

fs.writeFileSync('./scripts/workflow_image_generator_v2.json', JSON.stringify(data, null, 2), 'utf8');
console.log('Done!');
