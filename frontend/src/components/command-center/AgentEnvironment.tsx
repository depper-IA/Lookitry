'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface AgentMetrics {
  tasks?: number;
  messages?: number;
  health?: number;
  linesCode?: number;
  commits?: number;
  components?: number;
  testsPassing?: number;
  testsFailing?: number;
  coverage?: number;
  queries?: number;
  embeddings?: number;
  uptime?: number;
  pnl?: number;
  trades?: number;
  positions?: number;
  alerts?: number;
  scanned?: number;
  blocked?: number;
  posts?: number;
  engagement?: number;
  followers?: number;
  incidents?: number;
  deploys?: number;
  campaigns?: number;
  leads?: number;
  conversions?: number;
  deals?: number;
  revenue?: number;
  calls?: number;
  [key: string]: number | undefined;
}

interface Agent {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'processing' | 'idle' | 'offline' | 'error';
  roomType: string;
  themeColor: string;
  accentColor: string;
  metrics: AgentMetrics;
  activity: string;
  position: { x: number; y: number };
  waypoints: { x: number; y: number }[];
  currentWaypoint: number;
  roomSvg?: string;
  characterSvg?: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
  color: string;
  agentId: string;
}

interface GameState {
  particles: Particle[];
  characterPositions: { [key: string]: { x: number; y: number } };
  characterBob: { [key: string]: number };
  radarAngle: number;
  tickerScroll: number;
  codeScroll: number;
  serverBlinkFrame: number;
}

// ============================================================================
// DATA
// ============================================================================

const AGENTS: Agent[] = [
  {
    id: 'sammantha',
    name: 'Sammy',
    role: 'COORDINATOR',
    status: 'active',
    roomType: 'control-tower',
    themeColor: '#00FFFF',
    accentColor: '#FF5C3A',
    metrics: { tasks: 47, messages: 23, health: 94 },
    activity: 'Coordinating sprint with Kira',
    position: { x: 0.5, y: 0.6 },
    waypoints: [
      { x: 0.5, y: 0.55 },
      { x: 0.3, y: 0.65 },
      { x: 0.7, y: 0.65 },
      { x: 0.5, y: 0.75 },
    ],
    currentWaypoint: 0,
  },
  {
    id: 'pixel',
    name: 'Pixel',
    role: 'FRONTEND DEV',
    status: 'active',
    roomType: 'dev-station',
    themeColor: '#8B5CF6',
    accentColor: '#00FFFF',
    metrics: { linesCode: 847, commits: 12, components: 3 },
    activity: 'Building AgentWorkspace component',
    position: { x: 0.45, y: 0.55 },
    waypoints: [
      { x: 0.45, y: 0.5 },
      { x: 0.6, y: 0.5 },
      { x: 0.45, y: 0.5 },
    ],
    currentWaypoint: 0,
  },
  {
    id: 'kira',
    name: 'Kira',
    role: 'QA TESTING',
    status: 'processing',
    roomType: 'lab',
    themeColor: '#00FF41',
    accentColor: '#FFD700',
    metrics: { testsPassing: 234, testsFailing: 2, coverage: 89 },
    activity: 'Running PR #47 test suite',
    position: { x: 0.5, y: 0.5 },
    waypoints: [
      { x: 0.5, y: 0.5 },
      { x: 0.3, y: 0.6 },
      { x: 0.7, y: 0.6 },
    ],
    currentWaypoint: 0,
  },
  {
    id: 'nadia',
    name: 'Nadia',
    role: 'DATA / AI',
    status: 'active',
    roomType: 'server-bay',
    themeColor: '#FF00FF',
    accentColor: '#00FFFF',
    metrics: { queries: 1247, embeddings: 38, uptime: 99.9 },
    activity: 'Processing embeddings batch',
    position: { x: 0.4, y: 0.6 },
    waypoints: [
      { x: 0.4, y: 0.5 },
      { x: 0.6, y: 0.5 },
      { x: 0.5, y: 0.65 },
    ],
    currentWaypoint: 0,
  },
  {
    id: 'leo',
    name: 'Leo',
    role: 'TRADING',
    status: 'active',
    roomType: 'trading-floor',
    themeColor: '#FFD700',
    accentColor: '#00E5A0',
    metrics: { pnl: 847.32, trades: 23, positions: 4 },
    activity: 'LONG BTC 0.05 @ $67,420',
    position: { x: 0.5, y: 0.55 },
    waypoints: [
      { x: 0.5, y: 0.5 },
      { x: 0.3, y: 0.55 },
      { x: 0.7, y: 0.55 },
      { x: 0.5, y: 0.5 },
    ],
    currentWaypoint: 0,
  },
  {
    id: 'cipher',
    name: 'Cipher',
    role: 'SECURITY',
    status: 'active',
    roomType: 'war-room',
    themeColor: '#FF003C',
    accentColor: '#FF8800',
    metrics: { alerts: 0, scanned: 1247, blocked: 3 },
    activity: 'Network scan complete — clean',
    position: { x: 0.5, y: 0.5 },
    waypoints: [{ x: 0.5, y: 0.5 }],
    currentWaypoint: 0,
  },
  {
    id: 'rebecca',
    name: 'Rebecca',
    role: 'INFLUENCER',
    status: 'active',
    roomType: 'studio',
    themeColor: '#EC4899',
    accentColor: '#F59E0B',
    metrics: { posts: 12, engagement: 847, followers: 2340 },
    activity: 'Creating UGC content for Fiverr',
    position: { x: 0.5, y: 0.55 },
    waypoints: [
      { x: 0.5, y: 0.5 },
      { x: 0.35, y: 0.6 },
      { x: 0.65, y: 0.6 },
    ],
    currentWaypoint: 0,
  },
  {
    id: 'zephyr',
    name: 'Zephyr',
    role: 'DEVOPS',
    status: 'active',
    roomType: 'server-room',
    themeColor: '#06B6D4',
    accentColor: '#22D3EE',
    metrics: { uptime: 99.99, incidents: 0, deploys: 5 },
    activity: 'Monitoring cluster health',
    position: { x: 0.5, y: 0.5 },
    waypoints: [
      { x: 0.4, y: 0.5 },
      { x: 0.6, y: 0.5 },
      { x: 0.5, y: 0.65 },
    ],
    currentWaypoint: 0,
  },
  {
    id: 'lina',
    name: 'Lina',
    role: 'MARKETING',
    status: 'idle',
    roomType: 'office',
    themeColor: '#F97316',
    accentColor: '#FCD34D',
    metrics: { campaigns: 3, leads: 47, conversions: 12 },
    activity: 'Planning Q2 campaign strategy',
    position: { x: 0.5, y: 0.5 },
    waypoints: [
      { x: 0.5, y: 0.5 },
      { x: 0.4, y: 0.6 },
    ],
    currentWaypoint: 0,
  },
  {
    id: 'marlo',
    name: 'Marlo',
    role: 'SALES',
    status: 'active',
    roomType: 'office',
    themeColor: '#10B981',
    accentColor: '#34D399',
    metrics: { deals: 8, revenue: 12500, calls: 23 },
    activity: 'Closing enterprise deal',
    position: { x: 0.5, y: 0.5 },
    waypoints: [
      { x: 0.5, y: 0.5 },
      { x: 0.6, y: 0.55 },
      { x: 0.4, y: 0.55 },
    ],
    currentWaypoint: 0,
  },
];

// ============================================================================
// STYLES
// ============================================================================

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap');
  
  * {
    box-sizing: border-box;
  }
  
  .agent-environment {
    min-height: 100vh;
    background: #050508;
    color: #fff;
    font-family: 'JetBrains Mono', monospace;
    overflow-x: hidden;
  }
  
  .stars-bg {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
  }
  
  .command-header {
    position: sticky;
    top: 0;
    z-index: 100;
    background: linear-gradient(180deg, #0a0a12 0%, #050508 100%);
    border-bottom: 1px solid #00FF4122;
    padding: 12px 20px;
  }
  
  .header-title {
    font-size: 14px;
    font-weight: 700;
    color: #00FF41;
    text-shadow: 0 0 10px #00FF4188;
    letter-spacing: 0.15em;
  }
  
  .header-metrics {
    display: flex;
    gap: 24px;
    font-size: 11px;
    margin-top: 8px;
    flex-wrap: wrap;
  }
  
  .header-metric {
    color: #888;
  }
  
  .header-metric span {
    color: #00FF41;
    font-weight: 500;
  }
  
  .header-controls {
    display: flex;
    gap: 8px;
    margin-top: 10px;
  }
  
  .speed-btn {
    background: #111;
    border: 1px solid #333;
    color: #666;
    padding: 4px 12px;
    font-size: 10px;
    font-family: 'JetBrains Mono', monospace;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .speed-btn:hover {
    border-color: #00FF41;
    color: #00FF41;
  }
  
  .speed-btn.active {
    background: #00FF4122;
    border-color: #00FF41;
    color: #00FF41;
  }
  
  .rooms-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 16px;
    padding: 20px;
    position: relative;
    z-index: 1;
  }
  
  .room-panel {
    background: #080815;
    border: 1px solid #333;
    border-radius: 6px;
    overflow: hidden;
    position: relative;
    transition: all 0.3s;
    cursor: pointer;
  }
  
  .room-panel:hover {
    transform: translateY(-2px);
  }
  
  .room-panel.active {
    border-color: var(--theme-color);
    box-shadow: 0 0 30px var(--theme-color)22, 0 0 60px var(--theme-color)11;
  }
  
  .room-panel.processing {
    animation: pulse-glow 2s infinite;
  }
  
  .room-panel.error {
    border-color: #FF003C;
    animation: glitch 0.3s infinite;
  }
  
  .room-panel.offline {
    filter: grayscale(0.8);
    opacity: 0.6;
  }
  
  @keyframes pulse-glow {
    0%, 100% { box-shadow: 0 0 20px var(--theme-color)22; }
    50% { box-shadow: 0 0 40px var(--theme-color)44; }
  }
  
  @keyframes glitch {
    0%, 100% { transform: translate(0); }
    25% { transform: translate(-1px, 1px); }
    50% { transform: translate(1px, -1px); }
    75% { transform: translate(-1px, -1px); }
  }
  
  .room-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    background: #0d0d1a;
    border-bottom: 1px solid #1a1a2e;
  }
  
  .room-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 9px;
    letter-spacing: 0.1em;
  }
  
  .status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--theme-color);
    box-shadow: 0 0 6px var(--theme-color);
  }
  
  .status-dot.active { background: var(--theme-color); box-shadow: 0 0 6px var(--theme-color); }
  .status-dot.processing { background: #FFD700; box-shadow: 0 0 6px #FFD700; animation: blink 1s infinite; }
  .status-dot.idle { background: #888; box-shadow: none; }
  .status-dot.offline { background: #444; box-shadow: none; }
  .status-dot.error { background: #FF003C; box-shadow: 0 0 6px #FF003C; animation: blink 0.5s infinite; }
  
  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }
  
  .room-name {
    color: var(--theme-color);
    font-weight: 600;
    text-shadow: 0 0 8px var(--theme-color)66;
  }
  
  .room-status {
    color: #666;
    font-size: 8px;
  }
  
  .room-viewport {
    height: 160px;
    position: relative;
    overflow: hidden;
    background: #080815;
  }
  
  .room-background {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .room-background svg {
    width: 100%;
    height: 100%;
  }
  
  .character-sprite {
    position: absolute;
    width: 32px;
    height: 48px;
    image-rendering: pixelated;
    image-rendering: crisp-edges;
    filter: drop-shadow(0 0 4px var(--theme-color));
    transition: transform 0.05s linear;
    z-index: 10;
  }
  
  .character-shadow {
    position: absolute;
    width: 20px;
    height: 6px;
    background: var(--theme-color);
    border-radius: 50%;
    opacity: 0.3;
    filter: blur(2px);
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
  }
  
  .room-canvas {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 20;
  }
  
  .room-effects {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 15;
  }
  
  .radar-sweep {
    position: absolute;
    bottom: 10px;
    right: 10px;
    width: 50px;
    height: 50px;
  }
  
  .room-metrics {
    padding: 10px 12px;
    background: #0a0a15;
    border-top: 1px solid #1a1a2e;
  }
  
  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    font-size: 9px;
    margin-bottom: 8px;
  }
  
  .metric-item {
    text-align: center;
  }
  
  .metric-value {
    color: var(--theme-color);
    font-weight: 600;
    font-size: 12px;
  }
  
  .metric-label {
    color: #555;
    text-transform: uppercase;
    font-size: 7px;
    letter-spacing: 0.05em;
  }
  
  .room-activity {
    font-size: 9px;
    color: #666;
    font-style: italic;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .particles-canvas {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 50;
  }
  
  .scanlines {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 200;
    background: repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(0, 0, 0, 0.03) 2px,
      rgba(0, 0, 0, 0.03) 4px
    );
  }
  
  .api-key-modal {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  
  .api-key-box {
    background: #0a0a15;
    border: 1px solid #00FF4144;
    border-radius: 8px;
    padding: 30px;
    max-width: 400px;
    text-align: center;
  }
  
  .api-key-box h2 {
    color: #00FF41;
    font-size: 14px;
    margin-bottom: 20px;
    text-shadow: 0 0 10px #00FF4188;
  }
  
  .api-key-input {
    width: 100%;
    background: #111;
    border: 1px solid #333;
    color: #fff;
    padding: 12px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    border-radius: 4px;
    margin-bottom: 15px;
  }
  
  .api-key-input:focus {
    outline: none;
    border-color: #00FF41;
  }
  
  .api-key-submit {
    background: #00FF4122;
    border: 1px solid #00FF41;
    color: #00FF41;
    padding: 10px 30px;
    font-family: 'JetBrains Mono', monospace;
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.2s;
  }
  
  .api-key-submit:hover {
    background: #00FF4144;
  }
  
  .generating-overlay {
    position: fixed;
    inset: 0;
    background: rgba(5, 5, 8, 0.95);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 999;
  }
  
  .generating-text {
    color: #00FF41;
    font-size: 14px;
    margin-bottom: 20px;
    text-shadow: 0 0 10px #00FF4188;
  }
  
  .progress-bar {
    width: 300px;
    height: 4px;
    background: #222;
    border-radius: 2px;
    overflow: hidden;
  }
  
  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #00FF41, #00FFFF);
    transition: width 0.3s;
  }
  
  .data-stream {
    position: absolute;
    width: 1px;
    background: linear-gradient(180deg, transparent, #00FF4144, transparent);
    animation: stream-flow 3s linear infinite;
    opacity: 0.5;
  }
  
  @keyframes stream-flow {
    0% { transform: translateY(-100%); }
    100% { transform: translateY(100vh); }
  }
  
  .footer {
    text-align: center;
    padding: 20px;
    color: #333;
    font-size: 10px;
    position: relative;
    z-index: 1;
  }
  
  .time-display {
    font-size: 10px;
    color: #444;
  }
`;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateRoomSVG(agent: Agent): string {
  const color = agent.themeColor;
  const dark = '#080815';
  
  return `
    <svg viewBox="0 0 280 160" xmlns="http://www.w3.org/2000/svg">
      <!-- Floor grid -->
      <defs>
        <pattern id="grid-${agent.id}" width="20" height="12" patternUnits="userSpaceOnUse">
          <path d="M0 6 L10 0 L20 6 L10 12 Z" fill="none" stroke="${color}11" strokeWidth="0.5"/>
        </pattern>
      </defs>
      <rect width="280" height="160" fill="${dark}"/>
      <rect width="280" height="160" fill="url(#grid-${agent.id})"/>
      
      <!-- Back wall -->
      <rect x="0" y="0" width="280" height="100" fill="#0d0d1a"/>
      
      <!-- Monitors -->
      ${Array.from({ length: 4 }, (_, i) => `
        <rect x="${20 + i * 65}" y="15" width="50" height="35" fill="#111" stroke="${color}44" strokeWidth="1"/>
        <rect x="${25 + i * 65}" y="20" width="40" height="22" fill="#0a0a15"/>
        <rect x="${27 + i * 65}" y="22" width="36" height="3" fill="${color}33"/>
        <rect x="${27 + i * 65}" y="27" width="20" height="2" fill="${color}22"/>
        <rect x="${27 + i * 65}" y="31" width="28" height="2" fill="${color}22"/>
      `).join('')}
      
      <!-- Center piece based on room type -->
      ${agent.roomType === 'control-tower' ? `
        <ellipse cx="140" cy="130" rx="60" ry="15" fill="${color}11"/>
        <ellipse cx="140" cy="130" rx="40" ry="10" fill="${color}22"/>
        <circle cx="140" cy="130" r="20" fill="none" stroke="${color}44" strokeWidth="1"/>
        <circle cx="140" cy="130" r="10" fill="${color}33"/>
      ` : agent.roomType === 'dev-station' ? `
        <rect x="100" y="90" width="80" height="50" fill="#111" stroke="${color}44"/>
        <rect x="105" y="95" width="35" height="25" fill="#0a0a15"/>
        <rect x="145" y="95" width="30" height="25" fill="#0a0a15"/>
        <text x="108" y="108" fill="${color}" font-size="4" font-family="monospace">const x = 42;</text>
        <text x="148" y="108" fill="${color}" font-size="4" font-family="monospace">⚡ 0 errors</text>
      ` : agent.roomType === 'lab' ? `
        <rect x="110" y="100" width="60" height="40" fill="#111" stroke="${color}44"/>
        <rect x="115" y="105" width="50" height="8" fill="#1a1a1a"/>
        <rect x="115" y="105" width="35" height="8" fill="${color}44"/>
        <text x="120" y="112" fill="#fff" font-size="5" font-family="monospace">BUILD: PASSING</text>
        <circle cx="125" cy="130" r="5" fill="#00FF41"/>
        <circle cx="140" cy="130" r="5" fill="#00FF41"/>
        <circle cx="155" cy="130" r="5" fill="#FF003C"/>
      ` : agent.roomType === 'server-bay' ? `
        ${Array.from({ length: 5 }, (_, i) => `
          <rect x="${60 + i * 30}" y="70" width="20" height="70" fill="#111" stroke="${color}33"/>
          ${Array.from({ length: 6 }, (_, j) => `
            <circle cx="${70 + i * 30}" cy="${80 + j * 10}" r="2" fill="${color}88">
              <animate attributeName="opacity" values="1;0.3;1" dur="${1 + Math.random()}s" repeatCount="indefinite"/>
            </circle>
          `).join('')}
        `).join('')}
      ` : agent.roomType === 'trading-floor' ? `
        <rect x="80" y="85" width="120" height="55" fill="#111"/>
        ${Array.from({ length: 6 }, (_, i) => `
          <rect x="${85 + i * 19}" y="90" width="15" height="45" fill="#0a0a15"/>
        `).join('')}
        <text x="90" y="108" fill="#FFD700" font-size="5" font-family="monospace">BTC $67.4k</text>
        <text x="130" y="108" fill="#00FF41" font-size="5" font-family="monospace">ETH $3.8k</text>
      ` : agent.roomType === 'war-room' ? `
        <circle cx="140" cy="110" r="40" fill="none" stroke="${color}33" strokeWidth="1"/>
        <circle cx="140" cy="110" r="25" fill="none" stroke="${color}44" strokeWidth="1"/>
        <circle cx="140" cy="110" r="10" fill="${color}22"/>
        <line x1="140" y1="110" x2="140" y2="70" stroke="${color}" strokeWidth="2" opacity="0.8"/>
      ` : `
        <!-- Default office -->
        <rect x="100" y="100" width="80" height="40" fill="#111" stroke="${color}44"/>
        <rect x="110" y="110" width="60" height="20" fill="#0a0a15"/>
      `}
      
      <!-- Floor glow -->
      <ellipse cx="140" cy="145" rx="80" ry="12" fill="${color}08"/>
    </svg>
  `;
}

function generateCharacterSVG(agent: Agent): string {
  const primary = agent.themeColor;
  const accent = agent.accentColor;
  const dark = '#0a0a1a';
  
  return `
    <svg viewBox="0 0 24 36" xmlns="http://www.w3.org/2000/svg">
      <!-- Shadow -->
      <ellipse cx="12" cy="35" rx="6" ry="2" fill="${primary}" opacity="0.3"/>
      
      <!-- Legs -->
      <rect x="7" y="26" width="4" height="8" fill="${dark}"/>
      <rect x="13" y="26" width="4" height="8" fill="${dark}"/>
      <rect x="7" y="26" width="4" height="3" fill="${primary}88"/>
      <rect x="13" y="26" width="4" height="3" fill="${primary}88"/>
      
      <!-- Body -->
      <rect x="6" y="14" width="12" height="13" fill="${primary}"/>
      <rect x="8" y="16" width="8" height="3" fill="${dark}"/>
      <rect x="8" y="20" width="8" height="2" fill="${accent}66"/>
      
      <!-- Arms -->
      <rect x="3" y="15" width="3" height="8" fill="${primary}"/>
      <rect x="18" y="15" width="3" height="8" fill="${primary}"/>
      <rect x="3" y="15" width="3" height="2" fill="${accent}"/>
      <rect x="18" y="15" width="3" height="2" fill="${accent}"/>
      
      <!-- Head -->
      <rect x="7" y="4" width="10" height="10" fill="${dark}"/>
      <rect x="8" y="5" width="8" height="8" fill="${primary}66"/>
      
      <!-- Visor -->
      <rect x="8" y="7" width="8" height="4" fill="${accent}"/>
      <rect x="9" y="8" width="6" height="2" fill="#fff" opacity="0.5"/>
      
      <!-- Antenna -->
      <rect x="11" y="1" width="2" height="4" fill="${primary}"/>
      <circle cx="12" cy="1" r="1.5" fill="${accent}"/>
    </svg>
  `;
}

// ============================================================================
// COMPONENTS
// ============================================================================

function StarsBackground() {
  const starsRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = starsRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const stars = Array.from({ length: 100 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 1.5 + 0.5,
      opacity: Math.random() * 0.7 + 0.3,
      twinkleSpeed: Math.random() * 0.02 + 0.01,
      twinkleOffset: Math.random() * Math.PI * 2,
    }));

    let frame = 0;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      frame++;

      stars.forEach((star) => {
        const twinkle = Math.sin(frame * star.twinkleSpeed + star.twinkleOffset);
        const opacity = star.opacity * (0.5 + twinkle * 0.5);
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.fillRect(star.x, star.y, star.size, star.size);
      });

      requestAnimationFrame(animate);
    };

    animate();

    return () => window.removeEventListener('resize', resize);
  }, []);

  return <canvas ref={starsRef} className="stars-bg" />;
}

function ParticlesCanvas({ particles }: { particles: Particle[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        ctx.fillStyle = p.color.replace(')', `, ${p.life})`).replace('rgb', 'rgba');
        ctx.fillRect(p.x, p.y, p.size, p.size);
      });

      requestAnimationFrame(animate);
    };

    animate();

    return () => window.removeEventListener('resize', resize);
  }, [particles]);

  return <canvas ref={canvasRef} className="particles-canvas" />;
}

function AgentRoom({
  agent,
  speed,
}: {
  agent: Agent;
  speed: number;
}) {
  const [metrics, setMetrics] = useState(agent.metrics);
  const charRef = useRef<HTMLDivElement>(null);
  const charPosRef = useRef({ x: 0.5, y: 0.6 });
  const waypointRef = useRef(0);
  const moveTimerRef = useRef(0);
  const idleTimerRef = useRef(0);
  const bobFrameRef = useRef(0);

  // Update metrics periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics((prev) => {
        const updated = { ...prev };
        const keys = Object.keys(updated) as (keyof AgentMetrics)[];
        const randomKey = keys[Math.floor(Math.random() * keys.length)];
        if (typeof updated[randomKey] === 'number') {
          const delta = Math.random() * 10 - 5;
          updated[randomKey] = Math.max(0, (updated[randomKey] as number) + delta);
        }
        return updated;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Character animation loop
  useEffect(() => {
    let animationId: number;
    const roomEl = charRef.current?.parentElement;
    if (!roomEl) return;

    const ROOM_WIDTH = roomEl.clientWidth;
    const ROOM_HEIGHT = roomEl.clientHeight;

    const animate = () => {
      const char = charRef.current;
      if (!char) {
        animationId = requestAnimationFrame(animate);
        return;
      }

      moveTimerRef.current += speed;

      if (moveTimerRef.current < 180) {
        // Moving to waypoint
        const waypoint = agent.waypoints[waypointRef.current];
        const targetX = waypoint.x * ROOM_WIDTH;
        const targetY = waypoint.y * ROOM_HEIGHT;

        const dx = targetX - charPosRef.current.x;
        const dy = targetY - charPosRef.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 2) {
          charPosRef.current.x += (dx / dist) * speed * 0.5;
          charPosRef.current.y += (dy / dist) * speed * 0.5;
        }

        // Bob animation        // Bob animation
        bobFrameRef.current++;
        const bob = Math.sin(bobFrameRef.current * 0.3) * 2;

        char.style.transform = `translate(${charPosRef.current.x - 16}px, ${charPosRef.current.y - 48 + bob}px)`;
      } else {
        // Idle
        idleTimerRef.current += speed;
        if (idleTimerRef.current > 120) {
          waypointRef.current = (waypointRef.current + 1) % agent.waypoints.length;
          moveTimerRef.current = 0;
          idleTimerRef.current = 0;
        }

        // Breathing animation
        bobFrameRef.current++;
        const scale = 1 + Math.sin(bobFrameRef.current * 0.05) * 0.02;
        char.style.transform = `translate(${charPosRef.current.x - 16}px, ${charPosRef.current.y - 48}px) scale(${scale})`;
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => cancelAnimationFrame(animationId);
  }, [agent, speed]);

  const roomSvg = useMemo(() => generateRoomSVG(agent), [agent]);
  const charSvg = useMemo(() => generateCharacterSVG(agent), [agent]);

  const statusLabel = useMemo(() => {
    switch (agent.status) {
      case 'active': return 'ACTIVE';
      case 'processing': return 'PROCESSING';
      case 'idle': return 'IDLE';
      case 'offline': return 'OFFLINE';
      case 'error': return 'ERROR';
      default: return 'UNKNOWN';
    }
  }, [agent.status]);

  return (
    <div
      className={`room-panel ${agent.status}`}
      style={{ '--theme-color': agent.themeColor } as React.CSSProperties}
    >
      <div className="room-header">
        <div className="room-badge">
          <span className={`status-dot ${agent.status}`} />
          <span className="room-name">{agent.name}</span>
        </div>
        <span className="room-status">{statusLabel}</span>
      </div>

      <div className="room-viewport">
        <div
          className="room-background"
          dangerouslySetInnerHTML={{ __html: roomSvg }}
        />
        <div
          ref={charRef}
          className="character-sprite"
          style={{
            left: charPosRef.current.x,
            top: charPosRef.current.y,
            '--theme-color': agent.themeColor,
          } as React.CSSProperties}
          dangerouslySetInnerHTML={{ __html: charSvg }}
        />
        <div className="character-shadow" />

        {/* Radar for war room */}
        {agent.roomType === 'war-room' && (
          <RadarEffect color={agent.themeColor} />
        )}

        {/* Trading ticker */}
        {agent.roomType === 'trading-floor' && (
          <TickerTape metrics={metrics} />
        )}
      </div>

      <div className="room-metrics">
        <div className="metrics-grid">
          {Object.entries(metrics).slice(0, 3).map(([key, value]) => (
            <div key={key} className="metric-item">
              <div className="metric-value">
                {typeof value === 'number' ? value.toFixed(0) : value}
              </div>
              <div className="metric-label">{key.toUpperCase()}</div>
            </div>
          ))}
        </div>
        <div className="room-activity">&ldquo;{agent.activity}&rdquo;</div>
      </div>
    </div>
  );
}

function RadarEffect({ color }: { color: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let angle = 0;
    const animate = () => {
      ctx.clearRect(0, 0, 50, 50);

      // Base circles
      ctx.strokeStyle = `${color}33`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(25, 25, 20, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(25, 25, 12, 0, Math.PI * 2);
      ctx.stroke();

      // Sweep
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(25, 25);
      ctx.lineTo(
        25 + Math.cos(angle) * 20,
        25 + Math.sin(angle) * 20
      );
      ctx.stroke();

      // Sweep trail
      ctx.fillStyle = `${color}44`;
      ctx.beginPath();
      ctx.moveTo(25, 25);
      ctx.arc(25, 25, 20, angle - 0.5, angle);
      ctx.fill();

      angle += 0.03;
      requestAnimationFrame(animate);
    };

    animate();
  }, [color]);

  return (
    <canvas ref={canvasRef} className="radar-sweep" width={50} height={50} />
  );
}

function TickerTape({ metrics }: { metrics: AgentMetrics }) {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setOffset((prev) => (prev - 1) % 200);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 5,
        left: offset,
        whiteSpace: 'nowrap',
        fontSize: 6,
        color: '#FFD700',
        fontFamily: 'JetBrains Mono, monospace',
      }}
    >
      BTC +2.4% | ETH +1.8% | SOL +3.2% | PNL: ${metrics.pnl?.toFixed(2) || '0.00'} | POSITIONS: {metrics.positions || 0}
    </div>
  );
}

export default function AgentEnvironment() {
  const [apiKey, setApiKey] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingProgress, setGeneratingProgress] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [agents, setAgents] = useState<Agent[]>(AGENTS);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Particle system
  useEffect(() => {
    const spawnParticle = () => {
      const activeAgents = agents.filter((a) => a.status === 'active' || a.status === 'processing');
      if (activeAgents.length === 0) return;

      const agent = activeAgents[Math.floor(Math.random() * activeAgents.length)];
      const roomEl = document.querySelector(`[data-agent-id="${agent.id}"] .room-viewport`);
      if (!roomEl) return;

      const rect = roomEl.getBoundingClientRect();

      setParticles((prev) => [
        ...prev.slice(-100),
        {
          x: rect.left + Math.random() * rect.width,
          y: rect.top + rect.height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: -Math.random() * 1 - 0.5,
          life: 1,
          size: 2 + Math.random() * 2,
          color: agent.themeColor,
          agentId: agent.id,
        },
      ]);
    };

    const interval = setInterval(spawnParticle, 200);
    return () => clearInterval(interval);
  }, [agents]);

  // Update particles
  useEffect(() => {
    const interval = setInterval(() => {
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            life: p.life - 0.01,
          }))
          .filter((p) => p.life > 0)
      );
    }, 16);
    return () => clearInterval(interval);
  }, []);

  const handleApiKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) return;

    setIsGenerating(true);
    setGeneratingProgress(0);

    // Simulate generation progress
    const interval = setInterval(() => {
      setGeneratingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsGenerating(false);
          return 100;
        }
        return prev + 2;
      });
    }, 100);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <StarsBackground />
      <ParticlesCanvas particles={particles} />
      <div className="scanlines" />

      <div className="agent-environment">
        {/* API Key Modal */}
        {!apiKey && !isGenerating && (
          <div className="api-key-modal">
            <div className="api-key-box">
              <h2>◉ LOOKITRY COMMAND CENTER</h2>
              <p style={{ color: '#666', fontSize: 11, marginBottom: 20 }}>
                Enter your OpenRouter API key to enable AI-generated assets.
                <br />
                (Optional — works with fallback SVGs without key)
              </p>
              <form onSubmit={handleApiKeySubmit}>
                <input
                  type="password"
                  className="api-key-input"
                  placeholder="sk-or-v1-..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
                <button type="submit" className="api-key-submit">
                  INITIALIZE
                </button>
              </form>
              <button
                onClick={() => setApiKey('demo')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#444',
                  fontSize: 10,
                  marginTop: 15,
                  cursor: 'pointer',
                }}
              >
                Skip — Use Demo Mode
              </button>
            </div>
          </div>
        )}

        {/* Generating Overlay */}
        {isGenerating && (
          <div className="generating-overlay">
            <div className="generating-text">
              ◉ INITIALIZING AGENT ENVIRONMENT
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${generatingProgress}%` }}
              />
            </div>
            <p style={{ color: '#444', fontSize: 10, marginTop: 15 }}>
              Generating room assets... {generatingProgress}%
            </p>
          </div>
        )}

        {/* Header */}
        <header className="command-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="header-title">◉ LOOKITRY COMMAND CENTER</div>
            <div className="time-display">{formatTime(currentTime)}</div>
          </div>

          <div className="header-metrics">
            <div className="header-metric">
              AGENTS: <span>{agents.filter((a) => a.status !== 'offline').length}/{agents.length}</span>
            </div>
            <div className="header-metric">
              ACTIVE: <span>{agents.filter((a) => a.status === 'active').length}</span>
            </div>
            <div className="header-metric">
              PROCESSING: <span>{agents.filter((a) => a.status === 'processing').length}</span>
            </div>
          </div>

          <div className="header-controls">
            {[{ label: '1x', value: 1 }, { label: '2x', value: 2 }, { label: '5x', value: 5 }].map((s) => (
              <button
                key={s.value}
                className={`speed-btn ${speed === s.value ? 'active' : ''}`}
                onClick={() => setSpeed(s.value)}
              >
                ▶ {s.label}
              </button>
            ))}
          </div>
        </header>

        {/* Agent Rooms Grid */}
        <div className="rooms-grid">
          {agents.map((agent) => (
            <div key={agent.id} data-agent-id={agent.id}>
              <AgentRoom agent={agent} speed={speed} />
            </div>
          ))}
        </div>

        {/* Footer */}
        <footer className="footer">
          LOOKITRY COMMAND CENTER v1.0 | All Systems Operational
        </footer>
      </div>
    </>
  );
}
