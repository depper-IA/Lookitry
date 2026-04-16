'use client';

import React from 'react';
import { Agent } from './types';
import { AnimatedSprite } from './AnimatedSprite';
import {
  ControlTowerRoom,
  MediaStudioRoom,
  TradingFloorRoom,
  DevStationRoom,
  ServerBayRoom,
  CrmHubRoom,
  LabRoom,
  WarRoomRoom,
} from './rooms';

const ROOM_RENDERERS: Record<string, React.ComponentType<{ color: string; accent: string }>> = {
  'control-tower': ControlTowerRoom,
  'media-studio':  MediaStudioRoom,
  'trading-floor': TradingFloorRoom,
  'dev-station':   DevStationRoom,
  'server-bay':    ServerBayRoom,
  'crm-hub':       CrmHubRoom,
  'lab':           LabRoom,
  'war-room':      WarRoomRoom,
};

interface Props {
  agent: Agent;
  charPos: { x: number; y: number };
  onClick: () => void;
  generatedChar?: string;
  generatedRoom?: string;
  isMoving: boolean;
  /** Status driven by parent heartbeat */
  agentStatus: {
    status: 'sleep' | 'idle' | 'busy' | 'error';
    task: string;
  };
  /** Custom room renderer — use for Sammy/immersive rooms */
  renderRoom?: () => React.ReactNode;
}

export function AgentRoomPanel({
  agent,
  charPos,
  onClick,
  generatedChar,
  generatedRoom,
  isMoving,
  agentStatus,
  renderRoom,
}: Props) {
  const c = agent.themeColor;
  const ca = agent.accentColor;

  // Derived status
  const statusColor =
    agentStatus.status === 'error' ? '#FF003C' :
    agentStatus.status === 'busy'  ? '#FFD700' : '#00FF41';

  const statusLabel =
    agentStatus.status === 'sleep' ? 'DORMIDA' :
    agentStatus.status === 'error' ? 'ERROR' :
    agentStatus.status === 'busy'  ? 'TRABAJANDO' : 'IDLE';

  const RoomRenderer = ROOM_RENDERERS[agent.roomType];

  return (
    <button
      onClick={onClick}
      className="cc-room-panel"
      style={{
        '--theme': c,
        borderColor: `${c}44`,
        boxShadow: `0 0 18px ${c}18, inset 0 0 24px #00000066`,
      } as React.CSSProperties}
    >
      {/* Room scene — custom renderer (e.g. SammyRoom) or SVG fallback */}
      <div style={{ position: 'relative', width: '100%', aspectRatio: '280/180', overflow: 'hidden' }}>
        {renderRoom ? (
          <>
            {renderRoom()}
            {/* Overlay sprite on top of custom room */}
            {generatedChar && generatedChar.includes('<svg') ? (
              <div style={{ position: 'absolute', bottom: 18, left: '50%', transform: 'translateX(-50%)' }}>
                <svg
                  viewBox="0 0 24 36"
                  width={48}
                  height={72}
                  dangerouslySetInnerHTML={{ __html: generatedChar }}
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>
            ) : (
              <div style={{
                position: 'absolute', bottom: 18, left: '50%', transform: 'translateX(-50%)',
                width: 48, height: 72,
                filter: `drop-shadow(0 0 8px ${c}66)`,
              }}>
                <AnimatedSprite color={c} accent={ca} x={24} y={36} isMoving={isMoving} />
              </div>
            )}
          </>
        ) : (
          <svg
            viewBox="0 0 280 180"
            width="100%"
            height="100%"
            xmlns="http://www.w3.org/2000/svg"
            style={{ display: 'block' }}
          >
            {/* Room background — AI-generated or fallback */}
            {generatedRoom && generatedRoom.includes('<svg') ? (
              <g dangerouslySetInnerHTML={{ __html: generatedRoom }} />
            ) : RoomRenderer ? (
              <RoomRenderer color={c} accent={ca} />
            ) : null}

            {/* Character sprite */}
            {generatedChar && generatedChar.includes('<svg') ? (
              <g
                dangerouslySetInnerHTML={{ __html: generatedChar }}
                transform={`translate(${charPos.x - 12}, ${charPos.y - 36})`}
                style={{ imageRendering: 'pixelated' }}
                className={isMoving ? 'walking' : ''}
              />
            ) : (
              <AnimatedSprite
                color={c}
                accent={ca}
                x={charPos.x}
                y={charPos.y}
                isMoving={isMoving}
              />
            )}
          </svg>
        )}

        {/* Status badge */}
        <div style={{
          position: 'absolute', top: 6, left: 6, right: 6,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 8,
          padding: '3px 8px',
          borderRadius: 2,
          border: `1px solid ${statusColor}55`,
          background: `${statusColor}11`,
          backdropFilter: 'blur(4px)',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 8,
          letterSpacing: '0.08em',
          color: statusColor,
          boxShadow: `0 0 8px ${statusColor}22`,
        }}>
          {/* Agent name + status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{
              width: 5, height: 5, borderRadius: '50%', background: statusColor,
              animation: agentStatus.status === 'busy' ? 'cc-pulse 0.4s infinite'
                       : agentStatus.status === 'sleep' ? 'cc-pulse 2.5s ease-in-out infinite'
                       : 'cc-pulse 1.5s ease-in-out infinite',
              boxShadow: `0 0 4px ${statusColor}`,
              flexShrink: 0,
            }} />
            <span>{agent.name.toUpperCase()} — {statusLabel}</span>
          </div>
          {/* Current task */}
          <span style={{
            opacity: 0.75,
            maxWidth: 120,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            textAlign: 'right',
          }}>
            {agentStatus.task.length > 22
              ? agentStatus.task.slice(0, 20) + '...'
              : agentStatus.task}
          </span>
        </div>

        {/* Room type label */}
        <div style={{
          position: 'absolute', bottom: 6, right: 6,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 7, color: c, opacity: 0.4,
          letterSpacing: '0.1em',
        }}>
          {agent.roomType.toUpperCase()}
        </div>
      </div>

      {/* Metrics bar */}
      <div style={{
        padding: '8px 10px 6px',
        borderTop: `1px solid ${c}22`,
        background: '#030508',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <span style={{ fontFamily: 'monospace', fontSize: 8, color: c, letterSpacing: '0.15em', opacity: 0.8 }}>
            {agent.role}
          </span>
          <span style={{ fontFamily: 'monospace', fontSize: 8, color: '#64748b' }}>{agent.icon}</span>
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
          {Object.entries(agent.metrics).map(([k, v]) => (
            <div key={k} style={{
              flex: 1,
              background: `${c}08`,
              border: `1px solid ${c}22`,
              borderRadius: 3,
              padding: '2px 4px',
              textAlign: 'center',
            }}>
              <div style={{ fontFamily: 'monospace', fontSize: 10, color: c, fontWeight: 700 }}>{v}</div>
              <div style={{ fontFamily: 'monospace', fontSize: 7, color: '#64748b', textTransform: 'uppercase' }}>{k}</div>
            </div>
          ))}
        </div>

        {/* Progress bar — uses 3rd metric */}
        {(() => {
          const keys = Object.keys(agent.metrics);
          const thirdKey = keys[2];
          const thirdVal = agent.metrics[thirdKey];
          return (
            <div style={{ height: 2, background: '#1e293b', borderRadius: 1, overflow: 'hidden', marginBottom: 4 }}>
              <div style={{
                height: '100%',
                background: c,
                width: `${typeof thirdVal === 'number' ? Math.min(thirdVal, 100) : 75}%`,
                transition: 'width 1s ease',
              }} />
            </div>
          );
        })()}

        <p style={{
          fontFamily: 'monospace', fontSize: 8, color: '#475569',
          margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {agent.activity}
        </p>
      </div>
    </button>
  );
}
