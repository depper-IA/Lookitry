const fs = require('fs');
const file = 'C:\\Users\\Matt\\Lookitry\\Describir con IA.json';
const data = JSON.parse(fs.readFileSync(file, 'utf8'));

// 1. Fix "Construir prompt enriquecido"
const promptNode = data.nodes.find(n => n.name === 'Construir prompt enriquecido');
promptNode.parameters.jsCode = `const response = $input.first().json;

const rawText = response?.choices?.[0]?.message?.content || '';
if (!rawText) throw new Error('OpenRouter no devolvio texto. Respuesta: ' + JSON.stringify(response).substring(0, 300));

let clean = rawText
  .replace(/\`\`\`json|\`\`\`/g, '')
  .replace(/^\\s*\\*+\\s*/gm, '')
  .replace(/^\\s*-+\\s*/gm, '')
  .trim();

let jsonStr = null;
let depth = 0;
let start = -1;

for (let i = 0; i < clean.length; i++) {
  if (clean[i] === '{') {
    if (depth === 0) start = i;
    depth++;
  } else if (clean[i] === '}') {
    depth--;
    if (depth === 0 && start !== -1) {
      jsonStr = clean.substring(start, i + 1);
      break;
    }
  }
}

if (!jsonStr) {
  throw new Error('No se encontro JSON en la respuesta | Raw: ' + clean.substring(0, 300));
}

jsonStr = jsonStr
  .replace(/\\}\\s*\\n\\s*\\*[^\\n]*/g, '}')
  .replace(/,\\s*\\n\\s*\\*[^\\n]*/g, ',')
  .trim();

let d;
try {
  d = JSON.parse(jsonStr);
} catch (e) {
  throw new Error('JSON invalido: ' + e.message + ' | Raw: ' + jsonStr.substring(0, 300));
}

const { productName, category: originalCategory } = $('Extraer parametros').first().json;
const dd = d.design_details || {};

const enrichedPrompt = [
  'Photorealistic virtual try-on image.',
  \`Product: \${productName}\${originalCategory ? ' (' + originalCategory + ')' : ''}.\`,
  \`Garment type: \${d.garment_type}, \${d.silhouette} silhouette, \${d.fit} fit.\`,
  \`Primary color: \${d.primary_color}.\`,
  d.secondary_colors?.length ? \`Secondary colors: \${d.secondary_colors.join(', ')}.\` : '',
  d.patterns ? \`Patterns and graphics: \${d.patterns}.\` : '',
  \`Material/texture: \${d.materials}.\`,
  \`Design details - neckline: \${dd.neckline || 'n/a'}, sleeves: \${dd.sleeves || 'n/a'}, closures: \${dd.closures || 'n/a'}\${dd.pockets ? ', pockets: ' + dd.pockets : ''}\${dd.other ? ', other: ' + dd.other : ''}.\`,
  'CRITICAL RULES:',
  '1. Reproduce the product EXACTLY: same colors, patterns, textures, logos, cuts and design details.',
  '2. Keep the persons face, skin tone, hair and body proportions identical to the selfie.',
  '3. The product must fit naturally on the persons body, respecting their pose and lighting.',
  '4. Maintain photorealistic quality with consistent lighting between person and product.',
  '5. Output only the final LOOKITRY image.',
].filter(Boolean).join(' ');

// Fix 1 & 3: Detect accessory and use specific prompt
const isAccessory = ['ACCESORIO', 'ACCESSORY', 'GAFAS', 'HELMET', 'RELOJ', 'BOLSO', 'ACCESORIOS']
  .some(k => (d.garment_type || '').toUpperCase().includes(k) 
          || (d.suggested_category || '').toUpperCase().includes(k)
          || (originalCategory || '').toUpperCase().includes(k));

let finalEnrichedPrompt;

if (isAccessory) {
  finalEnrichedPrompt = [
    'Photorealistic virtual try-on image of an accessory.',
    \`Product: \${productName}. Type: \${d.garment_type}.\`,
    \`Color: \${d.primary_color}.\`,
    d.materials ? \`Material: \${d.materials}.\` : '',
    d.patterns ? \`Details: \${d.patterns}.\` : '',
    'CRITICAL RULES FOR ACCESSORIES:',
    '1. Place the accessory naturally on the person — glasses on the face, watch on wrist, bag on shoulder.',
    '2. Respect the exact perspective, angle and lighting of the selfie.',
    '3. The accessory must cast realistic shadows and blend with the persons skin/face.',
    '4. Do NOT distort or alter the persons face, eyes, or facial features.',
    '5. Reproduce EXACT colors, frame shape, lens tint and brand details of the product.',
    '6. The result must look like a real photo, not a 3D render or illustration.',
    '7. Output only the final photorealistic image.',
  ].filter(Boolean).join(' ');
} else {
  finalEnrichedPrompt = enrichedPrompt;
}

// Map the suggested category correctly to VALID_CATEGORIES to prevent it from falling to "Otros"
let mappedCategory = d.suggested_category;
if (mappedCategory === 'ACCESORIO') mappedCategory = 'Accesorios';
if (mappedCategory === 'PANTALON') mappedCategory = 'Pantalones';
if (mappedCategory === 'ZAPATO' || mappedCategory === 'ZAPATOS') mappedCategory = 'Zapatos';
if (mappedCategory === 'CAMISA') mappedCategory = 'Camiseta';
if (mappedCategory === 'CHAQUETA') mappedCategory = 'Chaqueta';

const VALID_CATEGORIES = ['Camiseta', 'Hoodie', 'Chaqueta', 'Pantalones', 'Zapatos', 'Accesorios', 'Otros'];
const isValidOriginal = VALID_CATEGORIES.includes(originalCategory);
const category = isValidOriginal
  ? originalCategory
  : (VALID_CATEGORIES.includes(mappedCategory) ? mappedCategory : 'Otros');

return [{ json: { description: d, category, enrichedPrompt: finalEnrichedPrompt } }];`;

// 2. Fix "Formatear respuesta"
const formatNode = data.nodes.find(n => n.name === 'Formatear respuesta');
formatNode.parameters.jsCode = `const { enrichedPrompt, description: d, category: mappedCategory } = $input.first().json;

const parts = [];
if (d.garment_type) parts.push(d.garment_type + (d.silhouette ? ' de silueta ' + d.silhouette : ''));
if (d.primary_color) parts.push('Color principal: ' + d.primary_color);
if (d.secondary_colors?.length) parts.push('Colores secundarios: ' + d.secondary_colors.join(', '));
if (d.patterns) parts.push('Estampado: ' + d.patterns);
if (d.materials) parts.push('Material: ' + d.materials);
const dd = d.design_details || {};
const details = [
  dd.neckline && 'cuello ' + dd.neckline,
  dd.sleeves && 'mangas ' + dd.sleeves,
  dd.closures && 'cierre ' + dd.closures,
  dd.pockets && 'bolsillos: ' + dd.pockets,
  dd.other || null
].filter(Boolean);
if (details.length) parts.push('Detalles: ' + details.join(', '));
if (d.fit) parts.push('Fit: ' + d.fit);

const CATEGORY_MAP = {
  vestido: 'VESTIDO', dress: 'VESTIDO',
  camisa: 'CAMISA', shirt: 'CAMISA', top: 'TOP', blusa: 'BLUSA', blouse: 'BLUSA',
  pantalon: 'PANTALON', 'pantalón': 'PANTALON', pants: 'PANTS', jeans: 'JEANS', pantalones: 'PANTALON',
  falda: 'FALDA', skirt: 'FALDA',
  zapatos: 'ZAPATOS', shoes: 'ZAPATOS', calzado: 'ZAPATOS', footwear: 'ZAPATOS', zapato: 'ZAPATOS',
  conjunto: 'CONJUNTO', set: 'SET', outfit: 'CONJUNTO',
  chaqueta: 'CHAQUETA', jacket: 'JACKET', abrigo: 'ABRIGO', coat: 'ABRIGO',
  hoodie: 'HOODIE', sudadera: 'HOODIE',
  accesorio: 'ACCESORIO', accesorios: 'ACCESORIO', accessory: 'ACCESORIO', accessories: 'ACCESORIO',
  casco: 'HELMET', helmet: 'HELMET', reloj: 'ACCESORIO', bolso: 'ACCESORIO', gafas: 'ACCESORIO'
};

const rawType = (d.garment_type || '').toLowerCase().trim();

// 2. Fix CATEGORY_MAP for accessories and use the mapped category correctly
let finalCategory = CATEGORY_MAP[rawType] || d.garment_type?.toUpperCase() || null;

// If we still didn't map to ACCESORIO but it is one, force it
if (mappedCategory === 'Accesorios' && finalCategory !== 'ACCESORIO') {
   finalCategory = 'ACCESORIO';
}

return [{ json: { description: parts.join('. ') + '.', category: finalCategory, enrichedPrompt } }];`;

fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
console.log('File updated successfully.');