'use client';

import React from 'react';
import { Agent } from './types';

interface Props {
  agent: Agent;
  onClose: () => void;
  agentStatus: {
    status: 'sleep' | 'idle' | 'busy' | 'error';
    task: string;
    uptime: number;
  };
}

export function AgentModal({ agent, onClose, agentStatus }: Props) {
  const c = agent.themeColor;

  const statusColor =
    agentStatus.status === 'error' ? '#FF003C' :
    agentStatus.status === 'busy'  ? '#FFD700' : '#00FF41';

  const statusLabel =
    agentStatus.status === 'sleep' ? 'DORMIDA' :
    agentStatus.status === 'error' ? 'ERROR' :
    agentStatus.status === 'busy'  ? 'TRABAJANDO' : 'IDLE';

  const formatUptime = (s: number) => {
    if (!s) return '—';
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#0a0d17',
          border: `1px solid ${c}55`,
          boxShadow: `0 0 60px ${c}22, 0 25px 50px #00000088`,
          borderRadius: 16,
          width: '100%', maxWidth: 520,
          padding: '24px 28px 28px',
          fontFamily: "'JetBrains Mono', monospace",
          position: 'relative',
          overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Glow top */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: `linear-gradient(90deg, transparent, ${c}, transparent)`,
          opacity: 0.6,
        }} />

        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 16, right: 20,
            background: 'none', border: 'none',
            color: '#64748b', fontSize: 24, cursor: 'pointer',
            padding: 4, lineHeight: 1,
            transition: 'color 0.2s',
          }}
          onMouseOver={e => (e.currentTarget.style.color = '#f8fafc')}
          onMouseOut={e => (e.currentTarget.style.color = '#64748b')}
        >
          ×
        </button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <div style={{
            width: 60, height: 60, borderRadius: 12,
            background: `${c}18`,
            border: `2px solid ${c}44`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 30,
            boxShadow: `0 0 20px ${c}22`,
          }}>
            {agent.icon}
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#f8fafc', letterSpacing: '0.05em' }}>
              {agent.name}
            </h3>
            <p style={{ margin: 0, fontSize: 10, color: c, letterSpacing: '0.2em', marginTop: 3 }}>
              {agent.role}
            </p>
            {/* Status chip */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              marginTop: 6, padding: '2px 8px',
              borderRadius: 4,
              border: `1px solid ${statusColor}44`,
              background: `${statusColor}11`,
              fontSize: 8, color: statusColor, letterSpacing: '0.1em',
            }}>
              <span style={{
                width: 5, height: 5, borderRadius: '50%', background: statusColor,
                animation: agentStatus.status === 'busy' ? 'cc-pulse 0.4s infinite' : 'cc-pulse 1.5s infinite',
                boxShadow: `0 0 4px ${statusColor}`,
              }} />
              {statusLabel}
            </div>
          </div>
        </div>

        {/* Current task */}
        <div style={{
          background: `${c}06`,
          border: `1px solid ${c}22`,
          borderRadius: 8,
          padding: '10px 14px',
          marginBottom: 14,
        }}>
          <div style={{ fontSize: 8, color: '#64748b', letterSpacing: '0.15em', marginBottom: 4 }}>
            CURRENT TASK
          </div>
          <div style={{ fontSize: 11, color: '#f8fafc', lineHeight: 1.4 }}>
            {agentStatus.task}
          </div>
        </div>

        {/* Metrics grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
          {Object.entries(agent.metrics).map(([k, v]) => (
            <div key={k} style={{
              background: `${c}08`,
              border: `1px solid ${c}22`,
              borderRadius: 8,
              padding: '10px 8px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: c }}>{v}</div>
              <div style={{ fontSize: 7, color: '#64748b', textTransform: 'uppercase', marginTop: 2, letterSpacing: '0.1em' }}>
                {k}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom stats row */}
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1, background: `${c}08`, border: `1px solid ${c}22`, borderRadius: 8, padding: '8px 12px' }}>
            <div style={{ fontSize: 7, color: '#64748b', letterSpacing: '0.1em', marginBottom: 2 }}>UPTIME</div>
            <div style={{ fontSize: 11, color: c }}>{formatUptime(agentStatus.uptime)}</div>
          </div>
          <div style={{ flex: 1, background: `${c}08`, border: `1px solid ${c}22`, borderRadius: 8, padding: '8px 12px' }}>
            <div style={{ fontSize: 7, color: '#64748b', letterSpacing: '0.1em', marginBottom: 2 }}>ROOM TYPE</div>
            <div style={{ fontSize: 10, color: '#f8fafc' }}>{agent.roomType.replace('-', ' ').toUpperCase()}</div>
          </div>
          <div style={{ flex: 1, background: `${c}08`, border: `1px solid ${c}22`, borderRadius: 8, padding: '8px 12px' }}>
            <div style={{ fontSize: 7, color: '#64748b', letterSpacing: '0.1em', marginBottom: 2 }}>PATROL PTS</div>
            <div style={{ fontSize: 11, color: '#f8fafc' }}>{agent.patrol.length}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
