import { NextRequest, NextResponse } from 'next/server';

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';
const OPENROUTER_MODEL = 'google/gemini-2.5-flash';

const AGENTS_CONFIG: Record<string, { role: string; themeColor: string; accentColor: string; roomType: string }> = {
  sammy:        { role: 'COORDINATOR',       themeColor: '#00FFFF', accentColor: '#FF5C3A', roomType: 'control-tower' },
  rebecca:      { role: 'CONTENT / UGC',    themeColor: '#EC4899', accentColor: '#FCD34D', roomType: 'media-studio' },
  leo:          { role: 'TRADING',           themeColor: '#FFD700', accentColor: '#00E5A0', roomType: 'trading-floor' },
  webwizard:   { role: 'FRONTEND DEV',     themeColor: '#8B5CF6', accentColor: '#00FFFF', roomType: 'dev-station' },
  dataalchemist:{ role: 'BACKEND / DB',      themeColor: '#06B6D4', accentColor: '#FF00FF', roomType: 'server-bay' },
  growthpilot:  { role: 'SALES / CRM',      themeColor: '#10B981', accentColor: '#06B6D4', roomType: 'crm-hub' },
  devguardian:  { role: 'QA / SECURITY',    themeColor: '#00FF41', accentColor: '#FFD700', roomType: 'lab' },
  architectai:  { role: 'DEVOPS / VPS',      themeColor: '#FF003C', accentColor: '#FF8800', roomType: 'war-room' },
};

const ROOM_DESCRIPTIONS: Record<string, string> = {
  'control-tower': 'Curved command console in center, 3 holographic screens, circular radar sweep on floor',
  'media-studio':  'Ring light, camera stand, social media icons on walls, LED indicators',
  'trading-floor': '6 monitors with candlestick charts, real-time ticker tape, golden price displays',
  'dev-station':   'Dual monitors with code scrolling, mechanical keyboard, wall screens',
  'server-bay':    'Tall server racks with blinking LEDs, floating data particles, cable management trays',
  'crm-hub':      'Funnel chart, lead nodes connected, MRR counter display',
  'lab':           'Testing rigs with indicators, CI/CD pipeline display, microscope-like devices',
  'war-room':     'Circular radar with rotating sweep, network map on main wall, red alert panels',
};

async function callOpenRouter(prompt: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not configured');

  const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://lookitry.com',
      'X-Title': 'Lookitry Command Center'
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 4000,
      temperature: 0.3
    })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenRouter error ${res.status}: ${text}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

export async function POST(req: NextRequest) {
  try {
    const { agentId, type } = await req.json();

    if (!agentId || !type) {
      return NextResponse.json({ error: 'Missing agentId or type' }, { status: 400 });
    }

    const agent = AGENTS_CONFIG[agentId];
    if (!agent) {
      return NextResponse.json({ error: 'Unknown agent' }, { status: 400 });
    }

    let svg = '';

    if (type === 'character') {
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

      svg = await callOpenRouter(prompt);
    } else if (type === 'room') {
      const prompt = `Create an SVG isometric room background for a "${agent.role}" agent workstation in a sci-fi command center.

SVG specs:
- viewBox="0 0 280 180"
- Dark cyberpunk aesthetic
- Theme color: ${agent.themeColor}
- Background base: #080815

Include ONLY these SVG elements (no gradients, no filters, just rects/polygons/lines/circles/text):

1. Isometric floor: diamond/hex pattern using thin lines in ${agent.themeColor}15 on dark base
2. Back wall: dark rectangle with 3-4 small "monitor" rects with tiny pixel text
3. Left side wall: 2-3 vertical panels with indicator dots
4. Central element: ${ROOM_DESCRIPTIONS[agent.roomType] || 'a workstation console'}
5. Floor glow: 1-2 soft ellipses in ${agent.themeColor}18 near the center bottom

Color palette: only use #080815, #0d0d20, ${agent.themeColor}, ${agent.themeColor}88, ${agent.themeColor}44, ${agent.themeColor}22, #ffffff, #ffffff44
NO gradients. Use solid fills with opacity variations.
Output ONLY the SVG element, starting with <svg, no other text.`;

      svg = await callOpenRouter(prompt);
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json({ svg });
  } catch (err: any) {
    console.error('[generate-svg] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
