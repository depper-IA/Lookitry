const fs = require('fs');
const path = 'c:\\\\Users\\\\Usuario\\\\Mostrador_wilkiedevs\\\\templates-webs\\\\_wf_main_raw.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));

const validarNode = data.nodes.find(n => n.name === 'Validar Input');
if(validarNode) {
  validarNode.parameters.jsCode = `const item = $input.item.json;
const body = item.body || item;
if (!body || typeof body !== 'object') {
  throw new Error('No se recibio body valido. Recibido: ' + JSON.stringify(item).substring(0, 200));
}
const required = ['brand_id', 'product_id', 'selfie_url', 'product_image_url', 'prompt'];
const missing = required.filter(f => !body[f]);
if (missing.length > 0) {
  throw new Error('Faltan campos: ' + missing.join(', ') + '. Body recibido: ' + JSON.stringify(Object.keys(body)));
}
const urlRegex = /^https?:\\/\\/.+/;
if (!urlRegex.test(body.product_image_url)) {
  throw new Error('product_image_url no es URL valida: ' + body.product_image_url);
}
if (!urlRegex.test(body.selfie_url)) {
  throw new Error('selfie_url no es URL valida: ' + body.selfie_url);
}
const now = new Date();
const timestamp = now.toISOString();
const timestamp_safe = timestamp.replace(/[:.]/g, '-');
return { json: { brand_id: body.brand_id, product_id: body.product_id, selfie_url: body.selfie_url, product_image_url: body.product_image_url, prompt: body.prompt, timestamp, timestamp_safe } };`;
}

data.nodes = data.nodes.filter(n => n.name !== 'Subir Selfie Temporal');

const prepNode = data.nodes.find(n => n.name === 'Preparar Prompt Gemini');
if(prepNode) {
  prepNode.parameters.jsCode = `const data = $('Validar Input').item.json;
return { json: { brand_id: data.brand_id, product_id: data.product_id, product_image_url: data.product_image_url, timestamp: data.timestamp, timestamp_safe: data.timestamp_safe, full_prompt: data.prompt, selfie_url: data.selfie_url } };`;
}

const geminiNode = data.nodes.find(n => n.name === 'Generar con Gemini');
if(geminiNode) {
  geminiNode.parameters.jsonBody = `={{ JSON.stringify({ "model": "google/gemini-2.5-flash-image", "modalities": ["image", "text"], "messages": [{ "role": "user", "content": [ { "type": "text", "text": $json.full_prompt }, { "type": "image_url", "image_url": { "url": $json.selfie_url } }, { "type": "image_url", "image_url": { "url": $json.product_image_url } } ] }], "max_tokens": 1024, "temperature": 0.3 }) }}`;
}

const extractNode = data.nodes.find(n => n.name === 'Extraer Imagen Base64');
if(extractNode) {
  extractNode.parameters.jsCode = `const r = $input.item.json;
const prev = $('Preparar Prompt Gemini').item.json;
if (!r.choices?.[0]?.message) throw new Error('Respuesta invalida de Gemini: ' + JSON.stringify(r).substring(0,300));
const msg = r.choices[0].message;
let b64 = null;
if (Array.isArray(msg.images) && msg.images.length > 0) {
  const img = msg.images[0];
  if (img.image_url?.url) { const m = img.image_url.url.match(/base64,(.+)/s); if (m) b64 = m[1]; }
}
if (!b64 && Array.isArray(msg.content)) {
  for (const block of msg.content) {
    if (block.type === 'image_url' && block.image_url?.url?.startsWith('data:image')) {
      const m = block.image_url.url.match(/base64,(.+)/s); if (m) b64 = m[1];
    }
    if (block.type === 'image' && block.source?.data) b64 = block.source.data;
    if (block.type === 'inline_data' && block.inline_data?.data) b64 = block.inline_data.data;
  }
}
if (!b64 && typeof msg.content === 'string') {
  const m = msg.content.match(/data:image\\/[^;]+;base64,([A-Za-z0-9+\\/=\\s]+)/s);
  if (m) b64 = m[1];
}
if (!b64) throw new Error('No se encontro imagen. Estructura: ' + JSON.stringify({keys:Object.keys(msg), hasImages:!!msg.images, contentType:typeof msg.content}).substring(0,200));

return { json: {
  brand_id: prev.brand_id,
  product_id: prev.product_id,
  timestamp: prev.timestamp,
  timestamp_safe: prev.timestamp_safe,
  selfie_url: prev.selfie_url,
  selfie_width: 0,
  selfie_height: 0,
  generated_image_base64: b64.replace(/\\s+/g,'')
}};`;
}

if(data.connections['Validar Input']) {
  data.connections['Validar Input']['main'] = [[{"node":"Preparar Prompt Gemini","type":"main","index":0}]];
}
delete data.connections['Subir Selfie Temporal'];

fs.writeFileSync(path, JSON.stringify(data));
console.log("Updated workflow successfully!");
