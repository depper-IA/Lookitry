// Corrige el workflow "Describir con IA":
// 1. Actualiza el nodo "Respond 200" para incluir "description" como string plano
//    (el frontend espera data.description como texto, no como objeto)
// 2. Publica la versión draft (que tiene manejo de errores 400/500)

const API_KEY = "***REMOVED-SECRET***";
const WORKFLOW_ID = "ZjVTV3QxoPEi60GX";
const BASE_URL = "https://n8n.wilkiedevs.com/api/v1";

const headers = {
  "X-N8N-API-KEY": API_KEY,
  "Content-Type": "application/json",
};

// GET workflow actual
console.log("Obteniendo workflow...");
const getRes = await fetch(`${BASE_URL}/workflows/${WORKFLOW_ID}`, { headers });
if (!getRes.ok) { console.error("Error GET:", getRes.status, await getRes.text()); process.exit(1); }
const wf = await getRes.json();

console.log("Nodos en draft:", wf.nodes.map(n => n.name));

// Encontrar el nodo "Respond 200" en el draft y corregir el responseBody
// para que incluya "description" como string plano que el frontend pueda leer
const respond200Idx = wf.nodes.findIndex(n => n.name === "Respond 200");
if (respond200Idx === -1) { console.error("Nodo Respond 200 no encontrado"); process.exit(1); }

console.log("Respond 200 actual responseBody:", wf.nodes[respond200Idx].parameters.responseBody);

// El frontend hace: data.description || data.text || ''
// description debe ser un string plano con la descripción del producto
// Construimos el string a partir de los campos del objeto desc
const newResponseBody = `={{ JSON.stringify({
  success: true,
  description: [
    $json.description.garment_type,
    $json.description.silhouette ? '(' + $json.description.silhouette + ')' : '',
    'en ' + $json.description.primary_color,
    ($json.description.secondary_colors || []).length ? 'con ' + $json.description.secondary_colors.join(' y ') : '',
    $json.description.patterns ? 'Estampado: ' + $json.description.patterns + '.' : '',
    'Material: ' + $json.description.materials + '.',
    'Cuello: ' + ($json.description.design_details?.neckline || 'n/a') + ', mangas: ' + ($json.description.design_details?.sleeves || 'n/a') + ', cierre: ' + ($json.description.design_details?.closures || 'n/a') + ($json.description.design_details?.pockets ? ', bolsillos: ' + $json.description.design_details.pockets : '') + '.',
    'Fit: ' + $json.description.fit + '.'
  ].filter(Boolean).join(' '),
  prompt: $json.enrichedPrompt
}) }}`.replace(/\n\s*/g, ' ');

wf.nodes[respond200Idx].parameters.responseBody = newResponseBody;
console.log("Nuevo responseBody (primeros 120):", newResponseBody.substring(0, 120));

// PUT para guardar el draft corregido
const putPayload = {
  name: wf.name,
  nodes: wf.nodes,
  connections: wf.connections,
  settings: {
    executionOrder: wf.settings.executionOrder,
    saveManualExecutions: wf.settings.saveManualExecutions,
    callerPolicy: wf.settings.callerPolicy,
    errorWorkflow: wf.settings.errorWorkflow,
    timezone: wf.settings.timezone,
  },
};

console.log("Guardando draft corregido...");
const putRes = await fetch(`${BASE_URL}/workflows/${WORKFLOW_ID}`, {
  method: "PUT",
  headers,
  body: JSON.stringify(putPayload),
});
if (!putRes.ok) { console.error("Error PUT:", putRes.status, await putRes.text()); process.exit(1); }
const putData = await putRes.json();
console.log("Draft guardado - versionId:", putData.versionId);

// Publicar la versión draft para que sea la activa en producción
console.log("Publicando versión...");
const activateRes = await fetch(`${BASE_URL}/workflows/${WORKFLOW_ID}/activate`, {
  method: "POST",
  headers,
});
if (!activateRes.ok) {
  const errText = await activateRes.text();
  console.log("Activate response:", activateRes.status, errText);
  // Si ya está activo, no es error crítico
} else {
  console.log("Workflow activado correctamente");
}

// Verificar estado final
const verifyRes = await fetch(`${BASE_URL}/workflows/${WORKFLOW_ID}`, { headers });
const verifyData = await verifyRes.json();
console.log("Estado final - active:", verifyData.active);
console.log("versionId:", verifyData.versionId);
console.log("activeVersionId:", verifyData.activeVersionId);
console.log("¿Draft == Active?", verifyData.versionId === verifyData.activeVersionId);
