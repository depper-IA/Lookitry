# PROMPT COMPLETO — AGENT ENVIRONMENT ANIMADO
## Estilo: Ultronos / Command Center con personajes pixel art isométrico
### Para: Sam Wilkie (OpenClaw) con OpenRouter + Gemini

---

## CONTEXTO DE LO QUE QUIERES CONSTRUIR

Quiero un dashboard interactivo animado en React (single file .jsx) que replica el estilo visual del juego "Ultronos Command Center". Es un sistema donde múltiples "rooms" o habitaciones están visibles en pantalla al mismo tiempo, cada una como un panel/ventana con fondo isométrico 2.5D y personajitos pixel art moviéndose dentro. El resultado es una oficina de comando viva, oscura, cyberpunk, donde puedes ver todo lo que está pasando en tiempo real.

---

## DESCRIPCIÓN TÉCNICA DEL ESTILO VISUAL (del video)

### Apariencia General
- Fondo oscuro espacio exterior: negro profundo `#050508` con estrellas animadas flotando
- Las "rooms" son paneles rectangulares con bordes brillantes (glow), como ventanas en una nave espacial
- Entre los paneles hay "cables" y conectores de metal oscuro estilo `#1a1a2e`
- Cada room tiene un label/badge en la esquina superior izquierda con su nombre en verde neón (`● FACTORY DECK  ACTIVE`)
- Estética: pixel art + sci-fi + isométrico + holográfico

### Colores por tipo de room (del video):
- **Factory / Production rooms**: tonos azul-cian neón `#00FFFF`, amarillo `#FFB547`, naranja para items `#FF8C00`
- **War Room / Security**: rojo neón `#FF003C`, círculos radar rojos animados
- **Quarters / Rest**: violeta/morado `#8B5CF6`, atmósfera suave
- **Armory**: amarillo dorado `#FFD700`, hexagonos en el piso
- **Command Center**: verde matrix `#00FF41`, pantallas múltiples
- **Space/Exterior**: azul deep space `#0066FF`, estrellas

### Las Rooms (paneles) tienen:
1. **Fondo isométrico**: suelo de hexágonos o cuadrados en perspectiva, con profundidad
2. **Paredes laterales**: paneles de control, monitores, botones parpadeando
3. **Personajitos pixel art**: pequeños (16-24px), moviéndose, trabajando
4. **Elementos de UI superpuestos**: contadores, progress bars, métricas en tiempo real
5. **Efectos de luz**: glow en el suelo debajo del personaje, partículas

---

## LO QUE EL MODELO DEBE CONSTRUIR

Un React component (single .jsx file) con las siguientes características:

### Estructura Principal
```
┌─────────────────────────────────────────────────────────┐
│  HEADER: "LOOKITRY COMMAND CENTER"  ●ALL SYSTEMS ACTIVE  │
│  Day 0 — 05:38  [PAUSE] [1x] [2x]  REVENUE: $2,082      │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ ● SAMMANTHA  │  │ ● PIXEL DEV  │  │ ● KIRA QA    │  │
│  │   ACTIVE     │  │   ACTIVE     │  │   PROCESSING │  │
│  │  [ROOM ISO]  │  │  [ROOM ISO]  │  │  [ROOM ISO]  │  │
│  │  personaje   │  │  personaje   │  │  personaje   │  │
│  │  métricas    │  │  métricas    │  │  métricas    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ ● NADIA DB   │  │ ● LEO TRADE  │  │ ● CIPHER SEC │  │
│  │   ACTIVE     │  │   ACTIVE     │  │   ACTIVE     │  │
│  │  [ROOM ISO]  │  │  [ROOM ISO]  │  │  [ROOM ISO]  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Agentes / Rooms a Crear (6 iniciales):

| Room | Agente | Color Theme | Tipo de Room |
|------|--------|-------------|--------------|
| SAMMY (Sammantha) | Coordinadora | Cyan `#00FFFF` | Control Tower |
| PIXEL | Dev Frontend | Purple `#8B5CF6` | Dev Station |
| KIRA | QA Testing | Green `#00FF41` | Lab |
| NADIA | Data/DB | Magenta `#FF00FF` | Server Bay |
| LEO | Trading | Gold `#FFD700` | Trading Floor |
| CIPHER | Security | Red `#FF003C` | War Room |

tambien Agrega a Rebecca y los que hagan falta al culminar todo

---

## INSTRUCCIONES PARA GENERAR ASSETS CON IA

El modelo debe usar fetch a OpenRouter con el modelo `google/gemini-2.0-flash-exp:free` (o `google/gemini-2.5-flash-image`) para generar los siguientes assets como SVG inline o como base64 PNG usando la API de imágenes:

### Personajes (Characters) — Pixel Art
Para cada agente, llamar a la API con este prompt base, cambiando el color y tipo:

```
SYSTEM: You are a pixel art sprite generator. Output ONLY valid SVG code, nothing else. No markdown, no explanation.

USER: Create a tiny pixel art character sprite in isometric 2.5D view, top-down perspective at 45 degrees. 
Character type: [AGENT_TYPE]
Color palette: primary=[PRIMARY_COLOR], accent=[ACCENT_COLOR], dark=#0a0a1a
Style: sci-fi, cyberpunk, clean pixel art, 32x48 pixels logical size
The character should be:
- Facing slightly toward viewer (isometric south-east direction)
- Wearing a futuristic suit/uniform in the primary color
- Has a small glowing element (helmet visor or chest light) in accent color
- Simple idle pose, arms slightly out
Output: SVG with viewBox="0 0 32 48", pixel-perfect, no anti-aliasing, using only rect elements for pixels
Colors limited to 6-8 total colors maximum
```

### Fondos de Rooms (Backgrounds) — Isométrico
Para cada tipo de room, llamar con:

```
SYSTEM: You are an isometric pixel art background generator. Output ONLY valid SVG code, nothing else.

USER: Create an isometric room background for a [ROOM_TYPE] in a sci-fi space station.
Room dimensions: 200x160px viewBox
Style: pixel art, isometric 2.5D, top-down view, cyberpunk sci-fi
Primary theme color: [ROOM_COLOR]
Dark base: #080815

Include these elements in the SVG:
1. Isometric floor tiles (hexagonal or diamond pattern) in dark tones with subtle glow lines in [ROOM_COLOR] at 10% opacity
2. Back wall with tech panels, monitors, blinking lights (small rect elements)
3. Side wall visible on left side with more panels
4. A central platform or work desk area relevant to [ROOM_TYPE]:
   [See specifics per room below]
5. Ambient glow on floor from active equipment
6. NO characters, just the environment

Output: Clean SVG, no gradients that don't work in SVG, use linearGradient if needed, all paths/rects pixel-perfect
```

**Por tipo de room:**
- `Control Tower (Sammy)`: Curved command console in center, 3 holographic screens, circular radar sweep on floor
- `Dev Station (Pixel)`: Dual monitors with code scrolling, mechanical keyboard, reference screens on walls
- `Lab (Kira)`: Testing rigs, CI/CD pipeline display, green/red indicator panels, microscope-like devices
- `Server Bay (Nadia)`: Tall server racks with blinking LEDs, floating data particles, cable management trays
- `Trading Floor (Leo)`: 6 monitors with candlestick charts, real-time ticker tape, golden price displays
- `War Room (Cipher)`: Circular radar with rotating sweep, network map on main wall, alert panels, red emergency lighting

---

## IMPLEMENTACIÓN TÉCNICA COMPLETA

### Stack
- React 18 con hooks (useState, useEffect, useRef, useCallback)
- Canvas API para partículas y efectos de luz
- CSS animations para loops de personajes y ambientes
- requestAnimationFrame para movimiento de personajes
- Fetch a OpenRouter API para generar SVGs

### Datos Mock de Agentes
```javascript
const AGENTS = [
  {
    id: 'sammantha', name: 'Sammy', role: 'COORDINATOR',
    status: 'active', roomType: 'control-tower',
    themeColor: '#00FFFF', accentColor: '#FF5C3A',
    metrics: { tasks: 47, messages: 23, health: 94 },
    activity: 'Coordinating sprint with Kira',
    position: { x: 0.5, y: 0.6 }, // posición relativa dentro del room (0-1)
  },
  {
    id: 'pixel', name: 'Pixel', role: 'FRONTEND DEV',
    status: 'active', roomType: 'dev-station',
    themeColor: '#8B5CF6', accentColor: '#00FFFF',
    metrics: { linesCode: 847, commits: 12, components: 3 },
    activity: 'Building AgentWorkspace component',
    position: { x: 0.45, y: 0.55 },
  },
  {
    id: 'kira', name: 'Kira', role: 'QA TESTING',
    status: 'processing', roomType: 'lab',
    themeColor: '#00FF41', accentColor: '#FFD700',
    metrics: { testsPassing: 234, testsFailing: 2, coverage: 89 },
    activity: 'Running PR #47 test suite',
    position: { x: 0.5, y: 0.5 },
  },
  {
    id: 'nadia', name: 'Nadia', role: 'DATA / AI',
    status: 'active', roomType: 'server-bay',
    themeColor: '#FF00FF', accentColor: '#00FFFF',
    metrics: { queries: 1247, embeddings: 38, uptime: 99.9 },
    activity: 'Processing embeddings batch',
    position: { x: 0.4, y: 0.6 },
  },
  {
    id: 'leo', name: 'Leo', role: 'TRADING',
    status: 'active', roomType: 'trading-floor',
    themeColor: '#FFD700', accentColor: '#00E5A0',
    metrics: { pnl: 847.32, trades: 23, positions: 4 },
    activity: 'LONG BTC 0.05 @ $67,420',
    position: { x: 0.5, y: 0.55 },
  },
  {
    id: 'cipher', name: 'Cipher', role: 'SECURITY',
    status: 'active', roomType: 'war-room',
    themeColor: '#FF003C', accentColor: '#FF8800',
    metrics: { alerts: 0, scanned: 1247, blocked: 3 },
    activity: 'Network scan complete — clean',
    position: { x: 0.5, y: 0.5 },
  },
];
```

### Animaciones Requeridas

**1. Movimiento de Personaje (Character Walk Loop)**
```
El personaje debe hacer una ruta de patrol simple dentro de su room:
- Cada 3-5 segundos: camina de punto A a punto B (2-3 waypoints)
- Velocidad: 0.5-1 px/frame
- Mientras camina: bob animation (sube/baja 1px cada 4 frames)
- Al llegar al destino: queda 2-4 segundos en idle (breathing animation: escala 1.0 → 1.02)
- Idle: pequeña animación de "trabajando" según el tipo de agente
```

**2. Efectos de Ambiente por Room**
```
Control Tower (Sammy):
  - Radar sweep: círculo que rota 360° en 4 segundos, con trail neón cyan
  - Pantallas parpadeando: random opacity transitions en los monitores
  - Partículas de datos subiendo desde la consola

Dev Station (Pixel):
  - Código scrolling en los monitores: texto verde/morado que sube
  - Teclado: pequeño destello amarillo cada 500ms (typing)
  - Git commit: aparece "+1 COMMIT" flotando hacia arriba cada 8-12s

Lab (Kira):
  - Tests: indicadores alternando verde/rojo
  - Progress bar de CI/CD que avanza y se resetea
  - "BUILD PASSING" parpadea en verde

Server Bay (Nadia):
  - LEDs de servidores: parpadean en secuencia (chase pattern)
  - Partículas de datos: pequeños cuadrados de colores flotando hacia arriba
  - Número de queries incrementa visiblemente

Trading Floor (Leo):
  - Candlestick chart: barras que se actualizan cada 2s
  - Ticker tape: texto scrolleando horizontalmente
  - P&L counter: número que fluctúa arriba/abajo con color verde/rojo

War Room (Cipher):
  - Radar: línea verde/roja que rota con blips apareciendo
  - Alert counter: ocasionalmente flashea rojo
  - Network map: nodos que parpadean
```

**3. Efectos de Partículas por Estado**
```javascript
// Estado ACTIVE → partículas del color del agente flotando hacia arriba
// Estado PROCESSING → glow pulsante + partículas azules orbitando
// Estado ERROR → chispas rojas, glitch effect en el room border
// Estado OFFLINE → room en grayscale, no particles
```

**4. Efectos Globales**
```
- Estrellas en el fondo: 80 puntos blancos con opacity random 0.3-1.0, twinkle lento
- "Data streams": líneas delgadas de pixels que viajan entre rooms (conexiones)
- Header metrics: contadores animados con GSAP-like easing
- Scanlines CRT: overlay sutil en todo el canvas
```

### Estructura del Componente React

```jsx
// AgentEnvironment.jsx

// 1. OPENROUTER CONFIG
const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';
const MODEL = 'google/gemini-2.5-flash-image';
// API key: el usuario la ingresa en un input al inicio, se guarda en useState

// 2. ASSET GENERATION
// Al montar: llama a generateRoomSVG() y generateCharacterSVG() para cada agente
// Muestra skeleton/placeholder mientras carga
// Cachea en useState para no regenerar

// 3. GAME LOOP
// useRef para el animationFrame ID
// 60fps target
// Actualiza posiciones de personajes, partículas, efectos por frame

// 4. RENDER
// Canvas para partículas y efectos dinámicos (encima de todo)
// SVG o divs para los rooms (estáticos, cambian poco)
// React state para métricas (actualizadas cada segundo con setInterval)

// 5. INTERACTIVIDAD
// Click en room → expand modal con detalles del agente
// Hover → tooltip con última actividad
// Botones de speed: [1x] [2x] [5x] aceleran el game loop
```

### CSS Clave para el Look

```css
/* Room panel */
.room-panel {
  background: #080815;
  border: 1px solid [THEME_COLOR]33;
  box-shadow: 0 0 20px [THEME_COLOR]22, inset 0 0 30px #00000088;
  border-radius: 4px;
  position: relative;
  overflow: hidden;
}

/* Room active border glow */
.room-panel.active {
  border-color: [THEME_COLOR]88;
  box-shadow: 0 0 30px [THEME_COLOR]44, 0 0 60px [THEME_COLOR]22;
}

/* Status badge */
.room-badge {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  letter-spacing: 0.1em;
  color: [THEME_COLOR];
  background: [THEME_COLOR]11;
  border: 1px solid [THEME_COLOR]44;
  padding: 2px 6px;
  border-radius: 2px;
}

/* Header global */
.command-header {
  background: #050508;
  border-bottom: 1px solid #00FF4122;
  font-family: 'JetBrains Mono', monospace;
  color: #00FF41;
  text-shadow: 0 0 10px #00FF4188;
}

/* Scanlines overlay */
.scanlines::after {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg, transparent, transparent 2px,
    rgba(0,0,0,0.05) 2px, rgba(0,0,0,0.05) 4px
  );
  pointer-events: none;
  z-index: 100;
}

/* Character sprite container */
.character-sprite {
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  filter: drop-shadow(0 0 4px [THEME_COLOR]);
  transition: transform 0.1s linear;
}
```

---

## LLAMADAS A LA API DE OPENROUTER

### Configuración base
```javascript
async function callOpenRouter(prompt, apiKey, isImage = false) {
  const response = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://lookitry.com',
      'X-Title': 'Lookitry Agent Environment'
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 4000,
      temperature: 0.3
    })
  });
  const data = await response.json();
  return data.choices[0].message.content;
}
```

### Generar Room Background
```javascript
async function generateRoomBackground(agent, apiKey) {
  const prompt = `Create an SVG isometric room background for a "${agent.role}" agent workstation in a sci-fi command center.

SVG specs:
- viewBox="0 0 280 200"
- Dark cyberpunk aesthetic
- Theme color: ${agent.themeColor}
- Background base: #080815

Include ONLY these SVG elements (no gradients, no filters, just rects/polygons/lines/circles/text):

1. Isometric floor: diamond/hex pattern using thin lines in ${agent.themeColor}15 on dark base. Create ~15 diamond shapes using <polygon> to simulate isometric perspective
2. Back wall: dark rectangle with 4-6 small "monitor" rects (10x8px each) in ${agent.themeColor}88, some with tiny pixel text
3. Left side wall: 2-3 vertical panels with indicator dots
4. Central workstation element for "${agent.roomType}": ${getRoomCenterpiece(agent.roomType)}
5. Floor glow: 2 soft ellipses in ${agent.themeColor}18 near the center bottom

Color palette: only use #080815, #0d0d20, ${agent.themeColor}, ${agent.themeColor}88, ${agent.themeColor}44, ${agent.themeColor}22, #ffffff, #ffffff44
NO gradients. Use solid fills with opacity variations.
Output ONLY the SVG element, starting with <svg, no other text.`;

  return await callOpenRouter(prompt, apiKey);
}
```

### Generar Personaje
```javascript
async function generateCharacter(agent, apiKey) {
  const prompt = `Create a tiny pixel art character SVG for a sci-fi agent.

SVG specs:
- viewBox="0 0 24 36"  
- Character type: ${agent.role}
- Primary suit color: ${agent.themeColor}
- Dark outline: #0a0a1a
- Accent/visor: ${agent.accentColor}

Create the character using ONLY <rect> elements (pixel art style):
- Head: 8x8 area, centered, with visor/helmet in accent color
- Body: 10x10 torso with suit markings in primary color
- Arms: 3x6 each side
- Legs: 4x8 each, slightly apart for isometric feel
- Glow element: a 12x4 ellipse below feet in ${agent.themeColor}33

The character faces slightly to the right (isometric perspective).
Use 6-7 colors maximum.
Output ONLY the SVG element, starting with <svg, no other text.`;

  return await callOpenRouter(prompt, apiKey);
}
```

---

## UI COMPLETA — ELEMENTOS ADICIONALES

### Header del Command Center
```
┌──────────────────────────────────────────────────────────────────┐
│ [●] LOOKITRY COMMAND CENTER    Day 6 — 14:23:07 (real data)     ◉ ALL SYSTEMS │
│ REVENUE: $2,082.14 (Put real data from supabase)  ORDERS: 46 (no mock)  PRODUCTS: 14 (no mock)  LIVE  AGENTS: 6/6  │
│                      [■ PAUSE] [▶ 1x] [▶▶ 2x] [▶▶▶ 5x]          │
└──────────────────────────────────────────────────────────────────┘
```

### Room Panel (cada agente)
```
┌─ ● SAMMANTHA — ACTIVE ─────────────────────────────────┐
│                                                          │
│  [ISOMETRIC ROOM SVG WITH CHARACTER MOVING INSIDE]      │
│                                                          │
│  ────────────────────────────────────────────────────   │
│  TASKS: 47    MSGS: 23    HEALTH: 94%                   │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 65%  (progress)          │
│  "Coordinating sprint with Kira"                         │
└──────────────────────────────────────────────────────────┘
```

### Modal de Detalles (click en room)
```
Al hacer click en un room, se expande un modal oscuro con:
- Avatar grande del agente (SVG generado más grande)
- Historial de actividades (últimas 10 acciones)
- Mini sparkline chart de actividad últimas 24h
- Botón "ENTER ROOM" que simula entrar (zoom in animation)
```

---

## ESPECIFICACIONES ADICIONALES DE ANIMACIÓN

### Character Patrol Pattern
```javascript
// Cada agente tiene waypoints dentro de su room (coordenadas relativas 0-1)
const PATROL_ROUTES = {
  sammantha: [{x:0.5,y:0.55}, {x:0.3,y:0.65}, {x:0.7,y:0.65}, {x:0.5,y:0.75}],
  pixel:     [{x:0.45,y:0.5}, {x:0.6,y:0.5}, {x:0.45,y:0.5}], // va y vuelve al monitor
  kira:      [{x:0.5,y:0.5}, {x:0.3,y:0.6}, {x:0.7,y:0.6}],
  nadia:     [{x:0.4,y:0.5}, {x:0.6,y:0.5}, {x:0.5,y:0.65}],
  leo:       [{x:0.5,y:0.5}, {x:0.3,y:0.55}, {x:0.7,y:0.55}, {x:0.5,y:0.5}],
  cipher:    [{x:0.5,y:0.5}], // Cipher está quieto en el centro (observando radar)
};
```

### Efectos de Partículas (Canvas Layer)
```javascript
// Particle system simple con Canvas 2D
class Particle {
  // x, y: posición en el room
  // vx, vy: velocidad (-0.3 to 0.3, -1 to -0.3 para subir)
  // life: 0-1, decrement 0.01/frame
  // size: 2-4px (pixel art: solo cuadrados)
  // color: theme color del agente con opacity = life
}

// Spawn rate: 1 partícula / 3 frames por room activo
// Máximo 30 partículas por room
// Forma: cuadrados de 2x2 o 3x3 (pixel art style)
```

### Animación del Radar (War Room / Cipher)
```javascript
// Canvas circular con:
// - Base circular en #FF003C11
// - 2 anillos concéntricos en #FF003C44
// - Línea de barrido: rota 2π cada 3 segundos
//   Color: gradient de #FF003C00 a #FF003C88 (trail de 90°)
// - Blips: pequeños puntos que aparecen cuando el sweep los toca
//   Fade out en 2 segundos
// - Texto "SCANNING" parpadeando en la esquina
```

---

## OUTPUT ESPERADO

El modelo debe producir un único archivo `AgentEnvironment.jsx` que:

1. **Al abrir**: pide la API key de OpenRouter en un input (se guarda en state, nunca en localStorage)
2. **Al ingresar key**: comienza a generar assets con la IA (muestra progress "Generating room 1/6...")
3. **Mientras genera**: muestra placeholder rooms con animación shimmer
4. **Al completar**: renderiza la experiencia completa con todos los rooms animados
5. **Interactividad**:
   - Click en room → modal de detalles
   - Hover → tooltip con actividad actual
   - Botones de speed en header
   - Métricas se actualizan cada 5 segundos con valores aleatorios realistas

### Fallback sin API Key
Si el usuario no tiene API key, el componente debe funcionar con SVGs hardcodeados simples (formas geométricas básicas) para que la experiencia sea usable aunque sin los assets generados por IA.

---

## NOTAS FINALES PARA EL MODELO

- El componente debe ser **self-contained**: un solo archivo .jsx, sin imports externos excepto React
- Tailwind NO disponible: usar CSS-in-JS con `style={{}}` o un `<style>` tag inline
- Fonts: cargar JetBrains Mono desde Google Fonts via `@import` en el style tag
- Performance: usar `useMemo` y `useCallback` agresivamente, el game loop NO debe causar re-renders de React
- Los SVGs generados por IA pueden ser imperfectos; manejar errores con try/catch y fallback a formas simples
- El canvas de partículas debe ser un elemento `<canvas>` separado con `position: absolute` encima de los rooms
- Total de líneas estimadas: 600-900 líneas de código
- Estilo visual de referencia: el juego "Ultronos" visto en TikTok (@androooooooooo8) — command center dark sci-fi con pixel art characters moviéndose en rooms isométricos

---
