---
inclusion: always
---

# Preferencia de Idioma

Responde siempre en español. Esto aplica a todas las conversaciones, sin excepción.

# Estilo de UI

No usar emojis en la interfaz de usuario. En su lugar, usar iconos SVG o componentes de iconos (por ejemplo, de `lucide-react` o iconos SVG inline) para mantener una apariencia profesional y consistente.

# Legibilidad de Textos en UI Oscura

El proyecto usa fondo oscuro (`#0a0a0a`, `#141414`). Los textos secundarios NUNCA deben usar grises muy oscuros como `#333`, `#444`, `#555`. Usar siempre variantes más claras y legibles:

- Textos de ayuda / secundarios: `#999` o `#aaa`
- Textos de features / listas: `#bbb` o `#ccc`
- Textos de contacto / links secundarios: `#999`
- Precios tachados: `#666`
- Notas al pie: `#777`
- Textos muy sutiles (mínimo): `#666`

Regla general: en fondos oscuros, el texto más tenue visible debe ser al menos `#666`. Nunca usar `#333`, `#444` ni `#555` para texto legible.

# Nombre de Marca

El nombre del proyecto es **Lookitry**. En el código JSX se escribe como:
```jsx
Look<span className="text-[#FF5C3A]">itry</span>
```
NUNCA usar "VirtualTryOn", "Virtual Try On" ni variantes antiguas en ningún componente de UI.

# Funcionalidades por Plan

- Plan PRO: el usuario puede modificar el slug del widget (la URL pública del probador).

# Regla Crítica: APIs y Modelos de IA — Solo Versiones Gratuitas

PROHIBIDO usar modelos de IA de pago sin consentimiento explícito del usuario.

- Google Gemini: solo `gemini-1.5-flash` o `gemini-2.0-flash` (tier gratuito). NUNCA `gemini-1.5-pro` ni modelos de pago.
- OpenRouter: solo modelos con sufijo `:free`. NUNCA modelos sin ese sufijo.
- OpenAI, Anthropic u otras APIs de pago: PROHIBIDO sin autorización explícita.
- En n8n: verificar siempre que el modelo configurado sea gratuito antes de usarlo.
- Si hay duda sobre el costo de un modelo, preguntar antes de usarlo.
