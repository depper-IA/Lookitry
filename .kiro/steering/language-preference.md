---
inclusion: always
---

# Preferencia de Idioma

Responde siempre en español. Esto aplica a todas las conversaciones, sin excepción.

# Estilo de UI

No usar emojis en la interfaz de usuario. En su lugar, usar iconos SVG o componentes de iconos (por ejemplo, de `lucide-react` o iconos SVG inline) para mantener una apariencia profesional y consistente.

# Legibilidad de Textos en UI Oscura

El proyecto usa fondo oscuro (`#0a0a0a`, `#141414`). Los textos secundarios NUNCA deben usar grises muy oscuros como `#333`, `#444`, `#555`. Usar siempre variantes más claras tirando a blanco y legibles:

- Textos de ayuda / secundarios: `#999` o `#aaa`
- Textos de features / listas: `#bbb` o `#ccc`
- Textos de contacto / links secundarios: `#999`
- Precios tachados: `#666`
- Notas al pie: `#777`
- Textos muy sutiles (mínimo): `#666`

Regla general: en fondos oscuros, el texto más tenue visible debe ser al menos `#666`. Nunca usar `#333`, `#444` ni `#555` para texto legible.

# Nombre de Marca

El nombre del proyecto es **Lookitry**. NUNCA usar "Virtual Try-On SaaS", "VirtualTryOn" ni variantes antiguas en ningún lugar — ni en emails, ni en UI, ni en comentarios de código visibles al usuario.

Dirección de email para tests: **imfeermejias@gmail.com** — todos los tests de correo electrónico deben enviarse a esta dirección.

En el código JSX se escribe como:
```jsx
Look<span className="text-[#FF5C3A]">itry</span>
```
NUNCA usar "VirtualTryOn", "Virtual Try On" ni variantes antiguas en ningún componente de UI.

# Funcionalidades por Plan

- Plan PRO: el usuario puede modificar el slug del widget (la URL pública del probador).

# Planes del sistema — Regla crítica

Los planes del sistema son: **TRIAL**, **BASIC**, **PRO**, **LANDING**.

- **TRIAL**: plan gratuito temporal. Es un estado independiente, NO es BASIC. En la BD el campo `plan` puede ser `BASIC` pero `trial_end_date` no nulo y en el futuro indica que está en trial. `is_in_trial` NO es una columna de la BD — se calcula en el backend comparando `trial_end_date > now && subscription_status !== 'active' && subscription_status !== 'expiring_soon'`. En toda la UI del admin se debe mostrar como `TRIAL` (badge violeta `#6366f1`) cuando `is_in_trial === true`.
- **BASIC**: plan de pago mensual básico ($150.000 COP). Solo aplica cuando `is_in_trial = false`.
- **PRO**: plan de pago mensual avanzado ($250.000 COP).
- **LANDING**: pago único por mini-landing.

NUNCA mostrar `BASIC` para una marca que esté en trial. El filtro de plan en tablas admin debe incluir `TRIAL` como opción separada.

# Regla Crítica: APIs y Modelos de IA — Solo Versiones Gratuitas

PROHIBIDO usar modelos de IA de pago sin consentimiento explícito del usuario.

- Google Gemini: solo `gemini-1.5-flash` o `gemini-2.0-flash` (tier gratuito). NUNCA `gemini-1.5-pro` ni modelos de pago.
- Embeddings: usar `text-embedding-004` de Google (gratuito en tier free).
- OpenRouter: solo modelos con sufijo `:free`. NUNCA modelos sin ese sufijo.
- OpenAI, Anthropic u otras APIs de pago: PROHIBIDO sin autorización explícita.
- En n8n: verificar siempre que el modelo configurado sea gratuito antes de usarlo.
- Si hay duda sobre el costo de un modelo, preguntar antes de usarlo.

# Regla Crítica: Generación de Imágenes — Calidad máxima al menor costo

- La generación de imágenes debe mantener la máxima similitud con el producto original y la foto del usuario.
- NO reducir resolución, pasos de inferencia ni calidad del modelo de imagen para ahorrar costos.
- Los costos se reducen optimizando el PROMPT (más preciso = menos reintentos), no degradando el modelo.
- El sistema RAG de feedback existe precisamente para mejorar prompts y reducir generaciones fallidas (que son el verdadero costo).
- Reglas base por categoría de prenda (prompt-rules.ts) son OBLIGATORIAS antes de cualquier llamada al modelo.

# Credenciales de Acceso (uso interno — NO exponer en código)

## Supabase
- URL: `https://vkdooutklowctuudjnkl.supabase.co`
- Anon Key: `***REMOVED-SECRET***`
- Service Key: `***REMOVED-SECRET***`

## n8n
- URL base: `https://n8n.wilkiedevs.com`
- Webhook tryon: `https://n8n.wilkiedevs.com/webhook/tryon`
- Webhook descriptor: `https://n8n.wilkiedevs.com/webhook/descriptor`
- API Key: `***REMOVED-SECRET***`
- Bearer Token: `Travis2305**`

## VPS (Hostinger)
- Host: `31.220.18.39`
- Puerto: `22`
- Usuario: `root`
- Contraseña: `Travis18456916#`

## Hosting compartido (Hostinger SSH)
- Host: `92.112.189.47`
- Puerto: `65002`
- Usuario: `u639440667`
- Contraseña: `Travis2305*`

## MinIO Storage
- Endpoint: `https://minio.wilkiedevs.com`
- Bucket: `images`
- Access Key: `Wilkiedevs`
- Secret Key: `Travis2305*`
- URL pública: `https://minio.wilkiedevs.com`

## SMTP (Hostinger)
- Host: `smtp.hostinger.com`
- Puerto: `465` (SSL)
- Usuario: `info@pruebalo.wilkiedevs.com`
- Contraseña: `Travis2305*`

## Wompi (Colombia — modo test)
- Public Key: `***REMOVED-SECRET***`
- Private Key: `***REMOVED-SECRET***`
- Events Secret: `test_events_ywYgTECX1VdqCmLiGPxeUYXzaJqIAVsg`
- Integrity Secret: `***REMOVED-SECRET***`

## GitHub
- Token: `***REMOVED-SECRET***`
- Repo: `https://github.com/depper-IA/virtual-tryon.git`

## OpenRouter
- API Key: `***REMOVED-SECRET***`
- Solo usar modelos con sufijo `:free`

## JWT
- Secret: `virtual-tryon-saas-secret-key-change-in-production-2026`

# Flujo de trabajo — Deploy y desarrollo local

## REGLA CRÍTICA: Trabajo en LOCAL
**Actualmente estamos trabajando en LOCAL. El deploy al VPS se hará UNA SOLA VEZ al final, cuando el usuario lo indique explícitamente después de completar TODAS las tareas pendientes.**

- NO hacer deploy después de cada tarea.
- NO ejecutar `_deploy_now.py` ni `git push` salvo orden explícita del usuario.
- Todos los cambios se acumulan localmente hasta que el usuario diga "hacer deploy".

## Deploy
- Hacer deploy solo cuando el usuario lo indique explícitamente, NO después de cada tarea.
- Acumular todos los cambios y hacer un único deploy al final con: `git add -A; git commit -m "..."; git push` seguido de `python scripts/_deploy_now.py` con el flag apropiado (`--frontend`, `--backend`, o sin flag para ambos).
- Usar `cwd: Mostrador_wilkiedevs` en lugar de `cd`.
- Separador de comandos en PowerShell: `;` (no `&&`).

## Desarrollo local
Para probar cambios en local sin deploy al VPS:

**Terminal 1 — Backend** (puerto 3001, usa Supabase en la nube):
```bash
cd Mostrador_wilkiedevs/backend
npm run dev
```

**Terminal 2 — Frontend** (puerto 3000):
Crear `Mostrador_wilkiedevs/frontend/.env.local` con:
```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://vkdooutklowctuudjnkl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<mismo valor que .env>
NEXT_PUBLIC_N8N_DESCRIPTOR_URL=https://n8n.wilkiedevs.com/webhook/descriptor
```
Luego:
```bash
cd Mostrador_wilkiedevs/frontend
npm run dev
```
El `.env.local` tiene prioridad sobre `.env` en Next.js. No se necesita BD local — todo apunta a Supabase en la nube.
