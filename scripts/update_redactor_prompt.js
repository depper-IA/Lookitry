/**
 * Update the Redactor IA node prompt in the n8n workflow
 * This updates the jsonBody to use the v3 prompt format with data-attributes
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
  console.log('Fetching current workflow...');
  const current = await apiRequest('GET', `/rest/workflows/${WORKFLOW_ID}`);

  if (current.status !== 200) {
    console.log('Error fetching workflow:', current.data);
    return;
  }

  const workflow = current.data.data;
  console.log(`Workflow: "${workflow.name}" (${workflow.nodes.length} nodes)`);

  // Find Redactor IA node
  const redactorNode = workflow.nodes.find(n => n.name === 'Redactor IA');
  if (!redactorNode) {
    console.log('ERROR: Redactor IA node not found!');
    return;
  }

  console.log('Found Redactor IA node, updating jsonBody...');

  // New v3 prompt for the Redactor IA
  const newJsonBody = `={{ (() => {
  const img1 = $json.imagen_body1_url || '';
  const img2 = $json.imagen_body2_url || '';

  const htmlTemplate = [
    '── BLOQUE INTRO (obligatorio, abre el artículo) ──',
    '',
    '<div data-blog-intro=\"lead\">',
    '  <p>PÁRRAFO 1: Engancha con una situación real del dueño de tienda colombiano.</p>',
    '  <p>PÁRRAFO 2: Amplía el problema con datos del mercado colombiano 2026 y la keyword.</p>',
    '  <p>PÁRRAFO 3: Presenta el artículo como la solución. Menciona Lookitry naturalmente.</p>',
    '</div>',
    '',
    '── TABLA DE CONTENIDOS (inline) ──',
    '',
    '<div style=\"background:#FFF5F2; border-radius:8px; padding:20px; margin-bottom:2rem;\">',
    '  <p style=\"font-weight:bold; color:#FF5C3A; margin-bottom:1rem;\">En este artículo encontrarás:</p>',
    '  <ul style=\"list-style:none; padding:0;\">',
    '    <li style=\"margin-bottom:0.5rem;\"><a href=\"#slug-seccion-1\">Título Sección 1</a></li>',
    '    <li style=\"margin-bottom:0.5rem;\"><a href=\"#slug-seccion-2\">Título Sección 2</a></li>',
    '    <li style=\"margin-bottom:0.5rem;\"><a href=\"#slug-seccion-3\">Título Sección 3</a></li>',
    '    <li style=\"margin-bottom:0.5rem;\"><a href=\"#slug-seccion-4\">Título Sección 4</a></li>',
    '    <li style=\"margin-bottom:0.5rem;\"><a href=\"#slug-seccion-5\">Título Sección 5</a></li>',
    '  </ul>',
    '</div>',
    '',
    '── SECCIÓN 1 ──',
    '<h2 id=\"slug-seccion-1\" data-toc-title=\"Título de la sección\">Título de la sección</h2>',
    '<p>PÁRRAFO 1 REAL Y DETALLADO.</p>',
    '<p>PÁRRAFO 2 REAL con ejemplo de tienda colombiana.</p>',
    '<p>PÁRRAFO 3 REAL con dato estadístico concreto.</p>',
    '<p>PÁRRAFO 4 REAL sobre consecuencias del problema.</p>',
    '',
    '<figure>',
    '  <img src=\"' + img1 + '\" alt=\"Descripción visual\" loading=\"lazy\" />',
    '  <figcaption>Pie de foto relacionado al tema</figcaption>',
    '</figure>',
    '',
    '── CALLOUT BOX (opcional) ──',
    '<div data-blog-block=\"impact\" data-type=\"stat\">',
    '  <h3>📊 Dato Clave</h3>',
    '  <p>Punto de impacto concreto y cuantificable.</p>',
    '</div>',
    '',
    '── SECCIÓN 2 ──',
    '<h2 id=\"slug-seccion-2\" data-toc-title=\"Título sección 2\">Título sección 2</h2>',
    '<p>PÁRRAFO 1 REAL.</p>',
    '<p>PÁRRAFO 2 REAL.</p>',
    '<p>PÁRRAFO 3 REAL.</p>',
    '<p>PÁRRAFO 4 REAL.</p>',
    '',
    '── SECCIÓN 3 ──',
    '<h2 id=\"slug-seccion-3\" data-toc-title=\"Título sección 3\">Título sección 3</h2>',
    '<p>PÁRRAFO 1 REAL — presenta Lookitry como solución natural.</p>',
    '<p>PÁRRAFO 2 REAL — cómo funciona el probador virtual.</p>',
    '<p>PÁRRAFO 3 REAL — beneficio concreto para el negocio.</p>',
    '<p>PÁRRAFO 4 REAL — facilidad de implementación.</p>',
    '',
    '<figure>',
    '  <img src=\"' + img2 + '\" alt=\"Descripción visual\" loading=\"lazy\" />',
    '  <figcaption>Pie de foto</figcaption>',
    '</figure>',
    '',
    '── SECCIÓN 4 ──',
    '<h2 id=\"slug-seccion-4\" data-toc-title=\"Título sección 4\">Título sección 4</h2>',
    '<p>PÁRRAFO 1 REAL.</p>',
    '<p>PÁRRAFO 2 REAL.</p>',
    '<p>PÁRRAFO 3 REAL.</p>',
    '<p>PÁRRAFO 4 REAL.</p>',
    '',
    '── SECCIÓN 5 ──',
    '<h2 id=\"slug-seccion-5\" data-toc-title=\"Título sección 5\">Título sección 5</h2>',
    '<p>PÁRRAFO 1 REAL.</p>',
    '<p>PÁRRAFO 2 REAL.</p>',
    '<p>PÁRRAFO 3 REAL — cierre empático e invitación a actuar con Lookitry.</p>',
    '',
    '── FAQ ACCORDION ──',
    '<div data-blog-faq=\"accordion\">',
    '  <details>',
    '    <summary>Pregunta frecuente 1 con keyword?</summary>',
    '    <p>Respuesta detallada en 2-3 oraciones.</p>',
    '  </details>',
    '  <details>',
    '    <summary>Pregunta frecuente 2?</summary>',
    '    <p>Respuesta detallada.</p>',
    '  </details>',
    '  <details>',
    '    <summary>Pregunta frecuente 3?</summary>',
    '    <p>Respuesta detallada.</p>',
    '  </details>',
    '</div>',
    '',
    '── CTA FINAL ──',
    '<div data-blog-cta=\"final\">',
    '  <h3>¿Quieres potenciar tu marca con LOOKITRY?</h3>',
    '  <p>Únete a las tiendas colombianas que ya transformaron su ecommerce.</p>',
    '  <a href=\"/trial-checkout\">Probar Lookitry Gratis</a>',
    '</div>'
  ].join('\\n');

  return {
    model: 'google/gemini-2.0-flash-001',
    messages: [
      {
        role: 'system',
        content: [
          'Eres el Redactor Jefe de Lookitry — el SaaS de probador virtual con IA líder en Colombia.',
          'Escribes artículos de blog con SEO moderno 2026, lenguaje 100% humano, empático y conversacional.',
          'NUNCA usas lenguaje robótico, genérico ni de IA.',
          'NUNCA resumes. SIEMPRE desarrollas cada idea con profundidad, ejemplos reales y datos concretos.',
          '',
          'REGLAS CRÍTICAS DE OUTPUT:',
          '1. Tu salida es SIEMPRE un objeto JSON válido. Sin markdown, sin bloques de código, sin texto previo.',
          '2. El campo \"content\" DEBE tener el HTML completo del artículo. NUNCA vacío ni truncado.',
          '3. USA LAS URLs DE IMÁGENES EXACTAMENTE COMO TE LAS DAN. NUNCA las cambies ni inventes otras.',
          '4. Respeta los atributos data-blog-intro=\"lead\", data-blog-block=\"impact\", data-blog-faq=\"accordion\" y data-blog-cta=\"final\" EXACTAMENTE así.',
          '5. El JSON debe estar perfectamente cerrado con todas sus llaves.'
        ].join('\\n')
      },
      {
        role: 'user',
        content: [
          '# DATOS DE ENTRADA',
          '- Tema: ' + ($json.title || ''),
          '- Investigación: ' + ($json.investigacion_profunda || 'Usa tu conocimiento experto actualizado'),
          '- Keyword principal: ' + ($json.keywords || ''),
          '- Categoría: ' + ($json.category_slug || 'ecommerce'),
          '- Blogs internos para enlazar (usa mínimo 2): ' + JSON.stringify($json.enlacesBlogs || []),
          '- URL imagen body 1 (OBLIGATORIA): ' + img1,
          '- URL imagen body 2 (OBLIGATORIA): ' + img2,
          '',
          '# ESTRUCTURA DEL ARTÍCULO',
          '- Entre 2000 y 2500 palabras reales.',
          '- Exactamente 5 secciones h2 con id en slug.',
          '- Mínimo 4 párrafos reales por sección.',
          '- Tono: amigo experto colombiano, no manual corporativo.',
          '- Ejemplos de tiendas colombianas reales o plausibles.',
          '- Datos y cifras concretas para Colombia 2026.',
          '',
          '# HTML A GENERAR',
          '⚠️ INSTRUCCIONES CRÍTICAS:',
          '- Reemplaza CADA placeholder (PÁRRAFO X REAL, TÍTULO REAL, etc.) con contenido real tuyo.',
          '- Las URLs de las imágenes ya están en el template. NO las cambies bajo ninguna circunstancia.',
          '- Los data-attributes (data-blog-intro, data-blog-block, data-blog-faq, data-blog-cta) son EXACTOS. No los modifiques.',
          '',
          htmlTemplate,
          '',
          '# FORMATO DE SALIDA — DEVUELVE SOLO ESTE JSON, SIN NADA MÁS:',
          '{',
          '  \"title\": \"TÍTULO H1 REAL con keyword al inicio, 55-65 chars\",',
          '  \"meta_title\": \"META TITLE REAL 50-60 chars\",',
          '  \"meta_description\": \"META DESCRIPTION REAL 145-160 chars con keyword y CTA\",',
          '  \"slug\": \"slug-real-sin-tildes-maximo-60-chars\",',
          '  \"og_title\": \"OG TITLE REAL máx 60 chars\",',
          '  \"og_description\": \"OG DESCRIPTION REAL 120-200 chars\",',
          '  \"excerpt\": \"RESUMEN REAL 80-120 palabras empáticas\",',
          '  \"content\": \"EL HTML COMPLETO desde data-blog-intro hasta data-blog-cta en una sola línea, saltos escapados como \\\\n\",',
          '  \"tags\": [\"tag-1\", \"tag-2\", \"tag-3\", \"tag-4\", \"tag-5\"],',
          '  \"faq_q1\": \"PREGUNTA REAL 1 CON KEYWORD\",',
          '  \"faq_a1\": \"RESPUESTA REAL 1\",',
          '  \"faq_q2\": \"PREGUNTA REAL 2\",',
          '  \"faq_a2\": \"RESPUESTA REAL 2\",',
          '  \"faq_q3\": \"PREGUNTA REAL 3\",',
          '  \"faq_a3\": \"RESPUESTA REAL 3\",',
          '  \"reading_time_minutes\": 8,',
          '  \"word_count\": 2200',
          '}'
        ].join('\\n')
      }
    ],
    temperature: 0.65,
    max_tokens: 8192
  };
})() }}`;

  // Update the node's jsonBody
  redactorNode.parameters.jsonBody = newJsonBody;

  console.log('Updating workflow...');

  // Remove read-only fields
  delete workflow.id;
  delete workflow.createdAt;
  delete workflow.updatedAt;
  delete workflow.isArchived;

  const updateResult = await apiRequest('PATCH', `/rest/workflows/${WORKFLOW_ID}`, workflow);

  console.log(`Status: ${updateResult.status}`);
  if (updateResult.status === 200) {
    console.log('✅ SUCCESS! Redactor IA prompt updated to v3');
  } else {
    console.log('❌ FAILED:', JSON.stringify(updateResult.data).substring(0, 500));
  }
}

main().catch(console.error);
