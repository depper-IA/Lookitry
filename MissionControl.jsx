import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import './mission-control.css';

// ─── AI GENERATION HELPERS ──────────────────────────────────────────────
async function fetchSVGFromAPI(agentId, type) {
  const res = await fetch('/api/command-center/generate-svg', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agentId, type })
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const data = await res.json();
  return data.svg || '';
}

// ─── AGENT DEFINITIONS ───────────────────────────────────────────────────────
const AGENTS = [
  {
    id: 'sammy', name: 'SAMMY', role: 'COORDINATOR', status: 'active',
    roomType: 'control-tower', themeColor: '#00FFFF', accentColor: '#FF5C3A',
    metrics: { tasks: 47, messages: 23, health: 94 },
    activity: 'Coordinating sprint with Kira',
    patrol: [{x:0.5,y:0.55},{x:0.3,y:0.65},{x:0.7,y:0.65},{x:0.5,y:0.75}],
  },
  {
    id: 'pixel', name: 'PIXEL', role: 'FRONTEND DEV', status: 'active',
    roomType: 'dev-station', themeColor: '#8B5CF6', accentColor: '#00FFFF',
    metrics: { lines: 847, commits: 12, components: 3 },
    activity: 'Building AgentWorkspace component',
    patrol: [{x:0.45,y:0.5},{x:0.6,y:0.5},{x:0.45,y:0.5}],
  },
  {
    id: 'kira', name: 'KIRA', role: 'QA TESTING', status: 'processing',
    roomType: 'lab', themeColor: '#00FF41', accentColor: '#FFD700',
    metrics: { passing: 234, failing: 2, coverage: 89 },
    activity: 'Running PR #47 test suite',
    patrol: [{x:0.5,y:0.5},{x:0.3,y:0.6},{x:0.7,y:0.6}],
  },
  {
    id: 'nadia', name: 'NADIA', role: 'DATA / AI', status: 'active',
    roomType: 'server-bay', themeColor: '#FF00FF', accentColor: '#00FFFF',
    metrics: { queries: 1247, embeddings: 38, uptime: 99.9 },
    activity: 'Processing embeddings batch',
    patrol: [{x:0.4,y:0.5},{x:0.6,y:0.5},{x:0.5,y:0.65}],
  },
  {
    id: 'leo', name: 'LEO', role: 'TRADING', status: 'active',
    roomType: 'trading-floor', themeColor: '#FFD700', accentColor: '#00E5A0',
    metrics: { pnl: 847, trades: 23, positions: 4 },
    activity: 'LONG BTC 0.05 @ $67,420',
    patrol: [{x:0.5,y:0.5},{x:0.3,y:0.55},{x:0.7,y:0.55},{x:0.5,y:0.5}],
  },
  {
    id: 'cipher', name: 'CIPHER', role: 'SECURITY', status: 'active',
    roomType: 'war-room', themeColor: '#FF003C', accentColor: '#FF8800',
    metrics: { alerts: 0, scanned: 1247, blocked: 3 },
    activity: 'Network scan complete — clean',
    patrol: [{x:0.5,y:0.5}],
  },
];

// ─── ROOM CANVAS RENDERER ────────────────────────────────────────────────────
function drawRoom(canvas, agent, frame, charPos) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const c = agent.themeColor;
  const hex = (opacity) => c + Math.round(opacity * 255).toString(16).padStart(2,'0');

  ctx.fillStyle = '#080815';
  ctx.fillRect(0, 0, W, H);

  // ── ISOMETRIC FLOOR ──
  const drawIsoFloor = () => {
    const tw = W * 0.22, th = tw * 0.5;
    const cols = 5, rows = 4;
    const startX = W * 0.5, startY = H * 0.52;
    for (let r = 0; r < rows; r++) {
      for (let col = 0; col < cols; col++) {
        const x = startX + (col - r) * tw * 0.5;
        const y = startY + (col + r) * th * 0.5;
        ctx.beginPath();
        ctx.moveTo(x, y - th * 0.5);
        ctx.lineTo(x + tw * 0.5, y);
        ctx.lineTo(x, y + th * 0.5);
        ctx.lineTo(x - tw * 0.5, y);
        ctx.closePath();
        ctx.fillStyle = '#0a0a1e';
        ctx.fill();
        ctx.strokeStyle = hex(0.25);
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }
  };

  // ── BACK WALL ──
  const drawBackWall = () => {
    ctx.fillStyle = '#0a0a1e';
    ctx.fillRect(W*0.05, H*0.05, W*0.9, H*0.42);
    ctx.strokeStyle = hex(0.15);
    ctx.lineWidth = 0.5;
    ctx.strokeRect(W*0.05, H*0.05, W*0.9, H*0.42);
    // divider line
    ctx.beginPath(); ctx.moveTo(W*0.5, H*0.05); ctx.lineTo(W*0.5, H*0.47);
    ctx.strokeStyle = hex(0.12); ctx.lineWidth = 0.5; ctx.stroke();
    // left panel dots
    for (let i = 0; i < 12; i++) {
      const bx = W*0.1 + (i%4)*14, by = H*0.1 + Math.floor(i/4)*14;
      const on = (frame + i*7) % 60 < 30;
      ctx.fillStyle = on ? c : hex(0.2);
      ctx.fillRect(bx, by, 5, 5);
    }
    // right panel — mini chart bars
    for (let i = 0; i < 8; i++) {
      const bh = 8 + Math.sin((frame*0.05)+i) * 6;
      ctx.fillStyle = hex(0.6);
      ctx.fillRect(W*0.55 + i*16, H*0.35 - bh, 8, bh);
    }
    // monitors top
    [[W*0.15,H*0.08],[W*0.38,H*0.07],[W*0.62,H*0.07],[W*0.8,H*0.08]].forEach(([mx,my]) => {
      ctx.fillStyle = '#0d1a2d';
      ctx.fillRect(mx, my, 26, 18);
      ctx.strokeStyle = hex(0.5); ctx.lineWidth = 0.5; ctx.strokeRect(mx, my, 26, 18);
      ctx.fillStyle = hex(0.3);
      ctx.fillRect(mx+2, my+2, 22, 14);
      // blinking content lines
      ctx.fillStyle = hex((Math.sin(frame*0.08 + mx)*0.5+0.5)*0.8);
      ctx.fillRect(mx+3, my+4, 16, 1.5);
      ctx.fillRect(mx+3, my+8, 12, 1.5);
      ctx.fillRect(mx+3, my+12, 14, 1.5);
    });
  };

  // ── ROOM-SPECIFIC CENTER ELEMENT ──
  const drawRoomCenter = () => {
    const cx = W*0.5, cy = H*0.55;

    if (agent.roomType === 'control-tower') {
      // U-shaped console
      ctx.fillStyle = '#0d1a2a';
      ctx.fillRect(cx-50, cy-12, 100, 24);
      ctx.fillStyle = '#112233';
      ctx.fillRect(cx-46, cy-8, 92, 16);
      // Orange buttons
      for (let i=0;i<6;i++) {
        ctx.fillStyle = (frame+i*10)%30<15 ? '#FF8C00' : '#FF8C0088';
        ctx.fillRect(cx-40+i*13, cy-4, 7, 5);
      }
      // Screens hovering above
      [-30,0,30].forEach((dx,i) => {
        const alpha = 0.4 + Math.sin(frame*0.05+i)*0.2;
        ctx.fillStyle = `rgba(0,255,255,${alpha*0.15})`;
        ctx.fillRect(cx+dx-16, cy-40, 28, 20);
        ctx.strokeStyle = hex(alpha*0.8); ctx.lineWidth=0.5;
        ctx.strokeRect(cx+dx-16, cy-40, 28, 20);
        // screen content lines
        ctx.fillStyle = hex(alpha*0.7);
        ctx.fillRect(cx+dx-13, cy-37, 20, 1.5);
        ctx.fillRect(cx+dx-13, cy-33, 15, 1.5);
        ctx.fillRect(cx+dx-13, cy-29, 18, 1.5);
      });
      // Radar on floor
      const radarCx = cx, radarCy = H*0.78;
      [40,28,16].forEach((r,i) => {
        ctx.beginPath(); ctx.arc(radarCx, radarCy, r, 0, Math.PI*2);
        ctx.strokeStyle = hex(0.15 + i*0.05); ctx.lineWidth=0.5; ctx.stroke();
      });
      // Sweep
      const angle = (frame * 0.04) % (Math.PI*2);
      const grad = ctx.createLinearGradient(
        radarCx, radarCy,
        radarCx + Math.cos(angle)*40, radarCy + Math.sin(angle)*40
      );
      grad.addColorStop(0, hex(0.6));
      grad.addColorStop(1, hex(0));
      ctx.beginPath(); ctx.moveTo(radarCx, radarCy);
      ctx.arc(radarCx, radarCy, 40, angle-0.8, angle);
      ctx.closePath();
      ctx.fillStyle = grad; ctx.fill();
    }

    else if (agent.roomType === 'dev-station') {
      // Dual monitors
      [cx-30, cx+10].forEach((mx,i) => {
        ctx.fillStyle = '#0d0d1a';
        ctx.fillRect(mx, cy-30, 35, 28);
        ctx.strokeStyle = hex(0.6); ctx.lineWidth=0.5; ctx.strokeRect(mx, cy-30, 35, 28);
        // Scrolling code lines
        for (let l=0; l<6; l++) {
          const scroll = (frame*0.5 + l*8) % 48;
          const lineY = cy-27 + l*4 - scroll%4;
          if (lineY < cy && lineY > cy-29) {
            const len = 8+Math.sin(l+frame*0.01)*8;
            ctx.fillStyle = hex(0.3 + Math.sin(l+frame*0.02)*0.2);
            ctx.fillRect(mx+3, lineY, len, 1.5);
            if (Math.random() > 0.97) {
              ctx.fillStyle = '#FFD70088';
              ctx.fillRect(mx+3+len, lineY, 3, 1.5);
            }
          }
        }
      });
      // Keyboard typing flash
      if (frame % 15 < 3) {
        ctx.fillStyle = '#FFD70088';
        ctx.fillRect(cx-30, cy+2, 70, 3);
      }
    }

    else if (agent.roomType === 'lab') {
      // Testing rigs
      for (let i=0; i<3; i++) {
        const rx = cx-35+i*35, ry = cy-15;
        ctx.fillStyle = '#0d1a0d';
        ctx.fillRect(rx, ry, 28, 30);
        ctx.strokeStyle = hex(0.5); ctx.lineWidth=0.5; ctx.strokeRect(rx, ry, 28, 30);
        // Pass/fail indicator
        const passing = Math.sin(frame*0.04+i*2) > 0;
        ctx.fillStyle = passing ? '#00FF4188' : '#FF003C88';
        ctx.fillRect(rx+8, ry+4, 12, 8);
        // Progress bar
        const prog = (frame*0.5+i*30) % 100;
        ctx.fillStyle = hex(0.2);
        ctx.fillRect(rx+3, ry+18, 22, 3);
        ctx.fillStyle = passing ? '#00FF41' : '#FFD700';
        ctx.fillRect(rx+3, ry+18, 22*prog/100, 3);
      }
      // BUILD text
      const buildPassing = Math.sin(frame*0.03) > 0;
      ctx.fillStyle = buildPassing ? `rgba(0,255,65,${0.5+Math.sin(frame*0.1)*0.3})` : 'rgba(255,0,60,0.6)';
      ctx.font = '7px JetBrains Mono';
      ctx.fillText(buildPassing ? 'BUILD PASSING' : 'BUILD FAILING', cx-24, cy+24);
    }

    else if (agent.roomType === 'server-bay') {
      // Server racks
      for (let rack=0; rack<3; rack++) {
        const rx = cx-42+rack*30, ry = cy-35;
        ctx.fillStyle = '#0a0a1e';
        ctx.fillRect(rx, ry, 24, 50);
        ctx.strokeStyle = hex(0.3); ctx.lineWidth=0.5; ctx.strokeRect(rx, ry, 24, 50);
        // LED chase
        for (let led=0; led<6; led++) {
          const on = (frame + rack*5 + led*3) % 18 < 9;
          ctx.fillStyle = on ? c : hex(0.15);
          ctx.fillRect(rx+4, ry+5+led*7, 16, 3);
        }
      }
      // Floating data particles
      for (let p=0; p<8; p++) {
        const py = H*0.3 - ((frame*0.8 + p*20) % (H*0.5));
        const px = cx - 20 + p*12;
        if (py > 0 && py < H) {
          ctx.fillStyle = hex(0.4 + Math.random()*0.3);
          ctx.fillRect(px, py, 3, 3);
        }
      }
    }

    else if (agent.roomType === 'trading-floor') {
      // 6 monitors with candles
      for (let m=0; m<6; m++) {
        const mx = cx-50+m*18, my = cy-25;
        ctx.fillStyle = '#0d0d10';
        ctx.fillRect(mx, my, 14, 18);
        ctx.strokeStyle = hex(0.4); ctx.lineWidth=0.5; ctx.strokeRect(mx, my, 14, 18);
        // Candles
        for (let b=0; b<4; b++) {
          const bh = 3 + Math.sin(frame*0.03 + m*3 + b*2)*3;
          const bull = Math.sin(frame*0.05+m+b) > 0;
          ctx.fillStyle = bull ? '#00FF4188' : '#FF003C88';
          ctx.fillRect(mx+2+b*3, my+15-bh, 2, bh);
        }
      }
      // Ticker tape
      ctx.fillStyle = '#0d0d10';
      ctx.fillRect(cx-55, cy+5, 110, 8);
      ctx.save();
      ctx.rect(cx-55, cy+5, 110, 8);
      ctx.clip();
      ctx.fillStyle = '#FFD70088';
      ctx.font = '6px JetBrains Mono';
      const ticker = 'BTC +2.4%  ETH -0.8%  SOL +5.1%  ARB +1.2%  ';
      ctx.fillText(ticker, cx-55 - (frame*1.5)%220, cy+12);
      ctx.restore();
      // P&L
      const pnl = 847 + Math.sin(frame*0.07)*50;
      ctx.fillStyle = pnl > 847 ? '#00FF41' : '#FF003C';
      ctx.font = '8px JetBrains Mono';
      ctx.fillText(`$${pnl.toFixed(0)}`, cx-12, cy-30);
    }

    else if (agent.roomType === 'war-room') {
      // Big radar
      const radarCx=cx, radarCy=cy+5;
      ctx.beginPath(); ctx.arc(radarCx, radarCy, 45, 0, Math.PI*2);
      ctx.fillStyle = '#FF003C08'; ctx.fill();
      [45,30,15].forEach((r,i) => {
        ctx.beginPath(); ctx.arc(radarCx, radarCy, r, 0, Math.PI*2);
        ctx.strokeStyle = `rgba(255,0,60,${0.15+i*0.1})`; ctx.lineWidth=0.5; ctx.stroke();
      });
      // Cross hairs
      ctx.strokeStyle = 'rgba(255,0,60,0.12)'; ctx.lineWidth=0.5;
      ctx.beginPath(); ctx.moveTo(radarCx-45, radarCy); ctx.lineTo(radarCx+45, radarCy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(radarCx, radarCy-45); ctx.lineTo(radarCx, radarCy+45); ctx.stroke();
      // Sweep
      const angle = (frame * 0.035) % (Math.PI*2);
      const grad2 = ctx.createConicalGradient ? null : null;
      ctx.beginPath();
      ctx.moveTo(radarCx, radarCy);
      ctx.arc(radarCx, radarCy, 45, angle-0.7, angle);
      ctx.closePath();
      ctx.fillStyle = `rgba(255,0,60,0.25)`; ctx.fill();
      // Sweep line
      ctx.beginPath();
      ctx.moveTo(radarCx, radarCy);
      ctx.lineTo(radarCx+Math.cos(angle)*45, radarCy+Math.sin(angle)*45);
      ctx.strokeStyle = 'rgba(255,0,60,0.8)'; ctx.lineWidth=1.5; ctx.stroke();
      // Blips
      const blipSeeds = [{x:15,y:-20},{x:-25,y:10},{x:30,y:25},{x:-10,y:30}];
      blipSeeds.forEach((bp,i) => {
        const blipAngle = Math.atan2(bp.y, bp.x);
        const diff = ((angle - blipAngle) + Math.PI*2) % (Math.PI*2);
        if (diff < 0.5) {
          const alpha = 1 - diff/0.5;
          ctx.beginPath(); ctx.arc(radarCx+bp.x, radarCy+bp.y, 2.5, 0, Math.PI*2);
          ctx.fillStyle = `rgba(255,0,60,${alpha})`; ctx.fill();
        }
      });
    }
  };

  // ── FLOOR GLOW ──
  const drawFloorGlow = () => {
    const grd = ctx.createRadialGradient(W*0.5, H*0.7, 0, W*0.5, H*0.7, W*0.35);
    grd.addColorStop(0, hex(0.08));
    grd.addColorStop(1, 'transparent');
    ctx.fillStyle = grd;
    ctx.fillRect(0, H*0.4, W, H*0.6);
  };

  // ── SAMMY CHARACTER SPRITE ──
  const drawCharacter = (px, py, color) => {
    const scale = 1.4;
    const bob = Math.sin(frame * 0.12) * 1.2;

    const drawRect = (x, y, w, h, col) => {
      ctx.fillStyle = col;
      ctx.fillRect(px+x*scale, py+y*scale+bob, w*scale, h*scale);
    };

    // Shadow glow under feet
    ctx.fillStyle = hex(0.12);
    ctx.beginPath();
    ctx.ellipse(px+8*scale, py+32*scale+bob, 10*scale, 4*scale, 0, 0, Math.PI*2);
    ctx.fill();

    // Legs
    drawRect(3, 24, 4, 8, color+'cc');
    drawRect(9, 24, 4, 8, color+'cc');
    // Boots
    drawRect(2, 30, 5, 4, color);
    drawRect(9, 30, 5, 4, color);
    // Body
    drawRect(2, 12, 13, 14, '#1a2a2a');
    // Suit chest
    drawRect(3, 13, 11, 11, color+'99');
    // Belt
    drawRect(2, 22, 13, 3, '#333333');
    // Belt buckle
    drawRect(6, 22, 5, 3, '#FF8C00');
    // Arms
    drawRect(0, 13, 3, 9, color+'88');
    drawRect(14, 13, 3, 9, color+'88');
    // Gloves
    drawRect(0, 21, 3, 3, color);
    drawRect(14, 21, 3, 3, color);
    // Shoulder pads
    drawRect(1, 12, 4, 3, color);
    drawRect(12, 12, 4, 3, color);
    // Neck
    drawRect(6, 9, 5, 4, '#b07040');
    // Head (afro)
    const hairCol = '#6B3A1F';
    drawRect(2, 0, 13, 10, hairCol);
    drawRect(1, 2, 15, 8, hairCol);
    drawRect(0, 3, 17, 6, hairCol);
    // Face
    drawRect(3, 3, 11, 8, '#c07848');
    // Eyes
    drawRect(4, 5, 2, 2, '#2a1510');
    drawRect(11, 5, 2, 2, '#2a1510');
    // Visor hint
    drawRect(3, 3, 11, 2, color+'44');
    // Chest light
    const pulseAlpha = 0.6 + Math.sin(frame*0.15)*0.4;
    ctx.fillStyle = `rgba(255,92,58,${pulseAlpha})`;
    ctx.fillRect(px+7*scale, py+15*scale+bob, 3*scale, 3*scale);
  };

  // ── PARTICLES ──
  // (handled by parent canvas, skipped here for performance)

  drawIsoFloor();
  drawBackWall();
  drawRoomCenter();
  drawFloorGlow();

  // Draw character at patrol position
  const charX = charPos.x * W - 8;
  const charY = charPos.y * H - 16;
  drawCharacter(charX, charY, agent.themeColor);
}

// ─── PARTICLE SYSTEM ─────────────────────────────────────────────────────────
class Particle {
  constructor(x, y, color) {
    this.x = x; this.y = y;
    this.vx = (Math.random()-0.5)*0.8;
    this.vy = -Math.random()*1.2-0.3;
    this.life = 1;
    this.decay = 0.008 + Math.random()*0.006;
    this.size = 2;
    this.color = color;
  }
  update() { this.x+=this.vx; this.y+=this.vy; this.life-=this.decay; }
  draw(ctx) {
    const alpha = this.life * 0.7;
    ctx.fillStyle = this.color + Math.round(alpha*255).toString(16).padStart(2,'0');
    ctx.fillRect(this.x, this.y, this.size, this.size);
  }
}

// ─── STARS BACKGROUND ────────────────────────────────────────────────────────
function drawStars(canvas, frame) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let i=0; i<80; i++) {
    const x = ((i*137.508 + i*i*0.1) % canvas.width);
    const y = ((i*97.333 + i*i*0.07) % canvas.height);
    const twinkle = 0.3 + 0.7*(Math.sin(frame*0.02+i*0.7)*0.5+0.5);
    ctx.fillStyle = `rgba(255,255,255,${twinkle*0.6})`;
    ctx.fillRect(x, y, 1.5, 1.5);
  }
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function MissionControl() {
  const [apiKey, setApiKey] = useState('');
  const [phase, setPhase] = useState('input'); // input | loading | ready
  const [loadingStep, setLoadingStep] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [metrics, setMetrics] = useState(() => {
    const m = {}; AGENTS.forEach(a => { m[a.id] = {...a.metrics}; }); return m;
  });
  const [generatedCharacters, setGeneratedCharacters] = useState({});
  const [generatedRooms, setGeneratedRooms] = useState({});
  const [genProgress, setGenProgress] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => { setIsMounted(true); }, []);

  const frameRef = useRef(0);
  const rafRef = useRef(null);
  const roomCanvases = useRef({});
  const starsCanvas = useRef(null);
  const particlesRef = useRef({});
  const charPositions = useRef({});
  const patrolIdx = useRef({});
  const patrolT = useRef({});

  // Init patrol positions
  useEffect(() => {
    AGENTS.forEach(a => {
      charPositions.current[a.id] = {...a.patrol[0]};
      patrolIdx.current[a.id] = 0;
      patrolT.current[a.id] = 0;
      particlesRef.current[a.id] = [];
    });
  }, []);

  // Update char positions
  const updatePositions = useCallback((spd) => {
    AGENTS.forEach(a => {
      const patrol = a.patrol;
      if (patrol.length === 1) return;
      const idx = patrolIdx.current[a.id];
      const next = (idx+1) % patrol.length;
      patrolT.current[a.id] += 0.004 * spd;
      if (patrolT.current[a.id] >= 1) {
        patrolT.current[a.id] = 0;
        patrolIdx.current[a.id] = next;
      }
      const t = patrolT.current[a.id];
      const from = patrol[idx], to = patrol[next];
      charPositions.current[a.id] = {
        x: from.x + (to.x-from.x)*t,
        y: from.y + (to.y-from.y)*t,
      };
    });
  }, []);

  // Update particles
  const updateParticles = useCallback((agent) => {
    const parts = particlesRef.current[agent.id];
    // Spawn
    if (parts.length < 25 && Math.random() < 0.4) {
      const canvas = roomCanvases.current[agent.id];
      if (canvas) {
        parts.push(new Particle(
          canvas.width*0.5 + (Math.random()-0.5)*40,
          canvas.height*0.6,
          agent.themeColor
        ));
      }
    }
    // Update & cull
    for (let i=parts.length-1; i>=0; i--) {
      parts[i].update();
      if (parts[i].life <= 0) parts.splice(i,1);
    }
  }, []);

  // Main game loop
  const gameLoop = useCallback(() => {
    const f = frameRef.current;
    frameRef.current++;
    drawStars(starsCanvas.current, f);
    updatePositions(speed);

    AGENTS.forEach(agent => {
      const canvas = roomCanvases.current[agent.id];
      if (!canvas) return;
      updateParticles(agent);
      drawRoom(canvas, agent, f*speed, charPositions.current[agent.id]);
      // Draw particles on room canvas
      const ctx = canvas.getContext('2d');
      particlesRef.current[agent.id].forEach(p => p.draw(ctx));
    });

    rafRef.current = requestAnimationFrame(gameLoop);
  }, [speed, updatePositions, updateParticles]);

  useEffect(() => {
    if (phase !== 'ready') return;
    rafRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase, gameLoop]);

  // Metrics ticker
  useEffect(() => {
    if (phase !== 'ready') return;
    const interval = setInterval(() => {
      setMetrics(prev => {
        const next = {...prev};
        AGENTS.forEach(a => {
          const m = {...next[a.id]};
          Object.keys(m).forEach(k => {
            if (typeof m[k] === 'number') {
              m[k] = Math.max(0, m[k] + (Math.random()-0.45)*m[k]*0.05);
              m[k] = parseFloat(m[k].toFixed(m[k] < 100 ? 1 : 0));
            }
          });
          next[a.id] = m;
        });
        return next;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [phase]);

  // Loading sequence
  const startLoading = useCallback(() => {
    setPhase('loading');
    let step = 0;
    const total = AGENTS.length + 2;
    const iv = setInterval(() => {
      step++;
      setLoadingStep(step);
      if (step >= total) { clearInterval(iv); setTimeout(() => setPhase('ready'), 500); }
    }, 400);
  }, []);

  const handleStart = () => {
    if (!apiKey.trim() && apiKey !== '__SKIP__') return;
    startLoading();
  };

  // AI asset generation
  useEffect(() => {
    if (phase !== 'ready') return;
    if (apiKey === '__SKIP__') return;

    const generate = async () => {
      const chars = {};
      const rooms = {};
      for (const agent of AGENTS) {
        setGenProgress(`Generating ${agent.name} character...`);
        try {
          const charSVG = await fetchSVGFromAPI(agent.id, 'character');
          if (charSVG.includes('<svg')) chars[agent.id] = charSVG;
        } catch (e) { console.error(e); }

        setGenProgress(`Generating ${agent.name} room...`);
        try {
          const roomSVG = await fetchSVGFromAPI(agent.id, 'room');
          if (roomSVG.includes('<svg')) rooms[agent.id] = roomSVG;
        } catch (e) { console.error(e); }
      }
      setGeneratedCharacters(chars);
      setGeneratedRooms(rooms);
      setGenProgress('');
    };
    generate();
  }, [phase, apiKey]);

  // ── RENDER: INPUT ──
  if (phase === 'input') return (
    <>
            <div className="api-screen">
        <div className="api-title">◉ MISSION CONTROL</div>
        <div className="api-sub">LOOKITRY COMMAND CENTER — v1.0</div>
        <input
          className="api-input"
          type="password"
          placeholder="ENTER OPENROUTER API KEY..."
          value={apiKey}
          onChange={e => setApiKey(e.target.value)}
          onKeyDown={e => e.key==='Enter' && handleStart()}
        />
        <button className="api-btn" onClick={handleStart}>▶ INITIALIZE SYSTEM</button>
        <div className="api-skip" onClick={() => { setApiKey('__SKIP__'); setTimeout(startLoading,100); }}>
          [ SKIP — USE FALLBACK MODE ]
        </div>
      </div>
    </>
  );

  // ── RENDER: LOADING ──
  if (phase === 'loading') return (
    <>
            <div className="loading-screen">
        <div className="loading-title">◉ INITIALIZING COMMAND CENTER</div>
        <div className="loading-bar-wrap">
          <div className="loading-bar" style={{width: `${(loadingStep/(AGENTS.length+2))*100}%`}} />
        </div>
        <div className="loading-step">
          {loadingStep === 0 && '[ CONNECTING TO NETWORK... ]'}
          {loadingStep === 1 && '[ LOADING STAR MAP... ]'}
          {loadingStep > 1 && loadingStep <= AGENTS.length+1 &&
            `[ INITIALIZING ROOM ${loadingStep-1}/${AGENTS.length}: ${AGENTS[loadingStep-2]?.name} ]`}
          {loadingStep > AGENTS.length+1 && '[ ALL SYSTEMS ACTIVE ]'}
        </div>
      </div>
    </>
  );

  // ── RENDER: READY ──
  const totalTasks = Object.values(metrics).reduce((s,m) => s + (m.tasks||m.lines||m.passing||m.queries||m.pnl||m.scanned||0), 0);

  return (
    <>
            <div className="mc-root scanlines">
        {/* Stars background - only render after mount to avoid hydration mismatch */}
        {isMounted && (
          <canvas
            ref={starsCanvas}
            className="stars-canvas"
            width={window.innerWidth}
            height={window.innerHeight}
          />
        )}

        {/* Header */}
        <div className="header">
          <div>
            <div className="header-title">◉ LOOKITRY COMMAND CENTER</div>
            <div style={{fontSize:'7px',color:'#00FF4144',letterSpacing:'0.1em',marginTop:2}}>
              ● ALL SYSTEMS ACTIVE — AGENTS: {AGENTS.length}/{AGENTS.length}
            </div>
          </div>

          <div className="header-metrics">
            {[
              {label:'REVENUE', value:`$${(2082+Math.sin(Date.now()*0.0001)*50).toFixed(0)}`},
              {label:'TASKS', value:Math.round(totalTasks)},
              {label:'UPTIME', value:'99.9%'},
              {label:'AGENTS', value:`${AGENTS.length}/6`},
            ].map(({label,value}) => (
              <div key={label} className="metric-item">
                <div className="metric-label">{label}</div>
                <div className="metric-value">{value}</div>
              </div>
            ))}
          </div>

          <div className="speed-btns">
            {[1,2,5].map(s => (
              <button
                key={s} className={`speed-btn${speed===s?' active':''}`}
                onClick={() => setSpeed(s)}
              >▶{s===5?'▶▶':''}▶ {s}x</button>
            ))}
          </div>
        </div>

        {/* Rooms grid */}
        <div className="rooms-grid">
          {AGENTS.map(agent => {
            const m = metrics[agent.id] || agent.metrics;
            const metricKeys = Object.keys(m);
            return (
              <div
                key={agent.id}
                className="room-panel"
                style={{
                  border: `1px solid ${agent.themeColor}44`,
                  boxShadow: `0 0 20px ${agent.themeColor}15, inset 0 0 30px #00000044`,
                }}
                onClick={() => setSelectedAgent(agent)}
              >
                {/* Badge */}
                <div
                  className="room-badge"
                  style={{color:agent.themeColor, borderColor:`${agent.themeColor}44`, background:`${agent.themeColor}11`}}
                >
                  <div className="badge-dot" style={{background:agent.themeColor}} />
                  {agent.name} — {agent.status.toUpperCase()}
                </div>

                {/* Room canvas */}
                <canvas
                  ref={el => { roomCanvases.current[agent.id] = el; }}
                  className="room-canvas"
                  width={280}
                  height={180}
                  style={{imageRendering:'pixelated'}}
                />
                {/* AI Generated room SVG overlay */}
                {generatedRooms[agent.id] && (
                  <div style={{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none',zIndex:5,opacity:0.7}}>
                    <div dangerouslySetInnerHTML={{ __html: generatedRooms[agent.id] }} style={{width:'100%',height:'100%'}} />
                  </div>
                )}
                {/* AI Generated character SVG overlay */}
                {generatedCharacters[agent.id] && (
                  <div style={{
                    position:'absolute',
                    left:`${charPositions.current[agent.id]?.x * 100 || 50}%`,
                    top:`${charPositions.current[agent.id]?.y * 100 || 50}%`,
                    transform:'translate(-50%, -100%)',
                    width:24,height:36,
                    pointerEvents:'none',
                    zIndex:10,
                  }}>
                    <div dangerouslySetInnerHTML={{ __html: generatedCharacters[agent.id] }} style={{width:24,height:36}} />
                  </div>
                )}

                {/* Footer */}
                <div className="room-footer">
                  <div className="room-metrics">
                    {metricKeys.slice(0,3).map(k => (
                      <div key={k}>
                        <span style={{color:agent.themeColor+'88'}}>{k.toUpperCase()} </span>
                        <span className="room-metric-val" style={{color:agent.themeColor}}>{String(m[k]).slice(0,7)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="room-activity">"{agent.activity}"</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal */}
        {selectedAgent && (
          <div className="modal-overlay" onClick={() => setSelectedAgent(null)}>
            <div
              className="modal"
              style={{borderColor: selectedAgent.themeColor+'66'}}
              onClick={e => e.stopPropagation()}
            >
              <div className="modal-header">
                <div className="modal-title" style={{color: selectedAgent.themeColor}}>
                  ◉ {selectedAgent.name} — {selectedAgent.role}
                </div>
                <button className="modal-close" onClick={() => setSelectedAgent(null)}>✕</button>
              </div>

              <canvas
                className="modal-canvas"
                width={380}
                height={200}
                ref={el => {
                  if (el) {
                    drawRoom(el, selectedAgent, frameRef.current, charPositions.current[selectedAgent.id] || selectedAgent.patrol[0]);
                  }
                }}
                style={{imageRendering:'pixelated', borderColor: selectedAgent.themeColor+'33', border:`0.5px solid`}}
              />

              <div className="modal-metrics">
                {Object.entries(metrics[selectedAgent.id] || selectedAgent.metrics).map(([k,v]) => (
                  <div key={k} className="modal-metric">
                    <div className="modal-metric-label">{k.toUpperCase()}</div>
                    <div className="modal-metric-value" style={{color:selectedAgent.themeColor}}>{String(v).slice(0,8)}</div>
                  </div>
                ))}
              </div>

              <div className="modal-log">
                {[
                  `[${new Date().toLocaleTimeString()}] ${selectedAgent.activity}`,
                  `[${new Date(Date.now()-30000).toLocaleTimeString()}] Status check — OK`,
                  `[${new Date(Date.now()-90000).toLocaleTimeString()}] Metrics updated`,
                  `[${new Date(Date.now()-180000).toLocaleTimeString()}] Agent initialized`,
                ].map((line,i) => <div key={i} style={{color: i===0 ? selectedAgent.themeColor+'cc' : '#ffffff33'}}>{line}</div>)}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
