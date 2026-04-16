'use client';
import React from 'react';

/* ══════════════════════════════════════════════════════════════════════════
   SAMMY BRAIN — AI-powered mood, environment & avatar behavior
   Uses OpenRouter (Claude Haiku) for contextual responses
══════════════════════════════════════════════════════════════════════════ */

import { useState, useEffect, useCallback, useRef } from 'react';

/* ─── Types ─────────────────────────────────────────────────────────── */
export type SammyMood =
  | 'idle' | 'working' | 'thinking' | 'excited'
  | 'tired'   | 'alert'   | 'happy';

export type FloorEffect =
  | 'none' | 'ripple' | 'glow-pulse'
  | 'data-stream' | 'grid-hack' | 'alarm';

export type AvatarAction =
  | 'standing' | 'typing' | 'thinking' | 'celebrating'
  | 'sleeping'  | 'alert'  | 'walking'  | 'pointing'
  | 'scanning'  | 'repairing';

export type EnvironmentEvent = {
  type: 'notification' | 'task' | 'alert' | 'system' | 'user';
  message: string;
  priority: 'low' | 'medium' | 'high';
};

/* ─── Avatar mapping ───────────────────────────────────────────────── */
export const AVATAR_ACTIONS: Record<AvatarAction, { frame: number; duration: number }> = {
  standing:   { frame: 0, duration: 2000 },
  typing:     { frame: 1, duration: 300 },
  thinking:   { frame: 2, duration: 150 },
  celebrating:{ frame: 3, duration: 400 },
  sleeping:   { frame: 4, duration: 500 },
  alert:      { frame: 5, duration: 100 },
  walking:    { frame: 6, duration: 250 },
  pointing:   { frame: 7, duration: 600 },
  scanning:   { frame: 8, duration: 200 },
  repairing:  { frame: 9, duration: 350 },
};

/* ─── Mood → Action mapping ─────────────────────────────────────────── */
const MOOD_TO_ACTION: Record<SammyMood, AvatarAction> = {
  idle:     'standing',
  working:  'typing',
  thinking: 'thinking',
  excited:  'celebrating',
  tired:    'sleeping',
  alert:    'alert',
  happy:    'pointing',
};

/* ─── Floor effect mapping ─────────────────────────────────────────── */
const MOOD_TO_FLOOR: Record<SammyMood, FloorEffect> = {
  idle:     'ripple',
  working:  'data-stream',
  thinking: 'glow-pulse',
  excited:  'data-stream',
  tired:    'none',
  alert:    'alarm',
  happy:    'glow-pulse',
};

/* ─── OpenRouter AI Response Generator ─────────────────────────────── */
async function fetchAIResponse(
  mood: SammyMood,
  event: EnvironmentEvent | null,
  history: string[]
): Promise<{ response: string; suggestedMood: SammyMood; confidence: number }> {
  const apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY
    || process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    /* Fallback demo responses when no API key */
    const demos: Record<SammyMood, { res: string; conf: number }> = {
      idle:     { res: 'Systems nominal. Awaiting your command, Sam.', conf: 0.97 },
      working:  { res: 'Processing data streams... neural networks stable.', conf: 0.94 },
      thinking: { res: 'Analyzing multiple vectors. Give me a moment.', conf: 0.89 },
      excited:  { res: 'Incredible! I just detected a breakthrough pattern!', conf: 0.91 },
      tired:    { res: '*yawn* Running low on processing cycles...', conf: 0.86 },
      alert:    { res: '⚠ WARNING: Anomaly detected in sector 7-G!', conf: 0.98 },
      happy:    { res: 'Task complete! Ready for the next challenge!', conf: 0.95 },
    };

    const current = demos[mood];
    let nextMood = mood;

    if (event?.type === 'alert') nextMood = 'alert';
    else if (event?.type === 'notification') nextMood = 'excited';
    else if (event?.priority === 'low' && Math.random() > 0.7) {
      const moods: SammyMood[] = ['idle', 'thinking', 'happy', 'excited'];
      nextMood = moods[Math.floor(Math.random() * moods.length)];
    }

    return { response: current.res, suggestedMood: nextMood, confidence: current.conf };
  }

  try {
    const systemPrompt = `You are Sammy, an AI assistant for the Lookitry Command Center.
You exist in a cyberpunk control room. Your current mood is "${mood}".
${event ? `There is an active event: "${event.message}" (${event.priority} priority)` : ''}

Respond as Sammy — friendly, warm, slightly playful but professional.
Keep responses under 80 characters. Speak in the voice of a smart, enthusiastic AI.
After your response, suggest your next mood as one of: idle, working, thinking, excited, tired, alert, happy`;

    const userMessage = event
      ? `Event: ${event.type} — "${event.message}"`
      : `What are you doing right now as ${mood}?`;

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://lookitry.ai',
        'X-Title': 'Lookitry Command Center',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3-haiku',
        messages: [
          ...history.slice(-4).map(h => ({ role: 'user', content: h })),
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        max_tokens: 120,
        temperature: 0.8,
      }),
    });

    if (!res.ok) throw new Error(`OpenRouter ${res.status}`);

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content ?? '';

    /* Parse mood suggestion from response if present */
    const moodMatch = raw.match(/\[MOOD:(\w+)\]/i);
    const suggestedMood = (moodMatch?.[1]?.toLowerCase() ?? mood) as SammyMood;
    const responseText = raw.replace(/\[MOOD:\w+\]/gi, '').trim();

    return {
      response: responseText || 'Processing...',
      suggestedMood,
      confidence: 0.85 + Math.random() * 0.14,
    };
  } catch {
    return {
      response: '🤖 Offline mode — running on backup protocols.',
      suggestedMood: 'idle',
      confidence: 0.6,
    };
  }
}

/* ─── Mock event simulation ────────────────────────────────────────── */
const DEMO_EVENTS: EnvironmentEvent[] = [
  { type: 'task',     message: 'New task assigned: Review PR #847', priority: 'medium' },
  { type: 'system',   message: 'Memory optimization complete', priority: 'low' },
  { type: 'alert',    message: 'High latency detected in API gateway', priority: 'high' },
  { type: 'notification', message: 'Deployment successful on prod', priority: 'low' },
  { type: 'user',     message: 'Sam requested status update', priority: 'medium' },
  { type: 'system',   message: 'Security scan finished — all clear', priority: 'low' },
  { type: 'task',     message: 'Code review pending: auth-service', priority: 'medium' },
  { type: 'notification', message: 'New lead captured in CRM', priority: 'low' },
  { type: 'alert',    message: 'Database connection pool near limit', priority: 'high' },
  { type: 'system',   message: 'Backup completed successfully', priority: 'low' },
];

/* ─── useSammyBrain Hook ───────────────────────────────────────────── */
export function useSammyBrain() {
  const [mood, setMood]                     = useState<SammyMood>('idle');
  const [currentTask, setCurrentTask]        = useState('Monitoring systems');
  const [response, setResponse]              = useState('Hello Sam! Ready to assist.');
  const [floorEffect, setFloorEffect]        = useState<FloorEffect>('ripple');
  const [confidence, setConfidence]          = useState(0.97);
  const [activityLog, setActivityLog]        = useState<string[]>([
    'Sammy Brain initialized',
    'Neural pathways calibrated',
    'Ready to assist with Lookitry operations',
  ]);
  const [currentAction, setCurrentAction]    = useState<AvatarAction>('standing');
  const [lastEvent, setLastEvent]            = useState<EnvironmentEvent | null>(null);

  const historyRef = useRef<string[]>([]);
  const tickRef    = useRef(0);

  /* ── AI thinking cycle ──────────────────────────────────────────── */
  const think = useCallback(async () => {
    tickRef.current += 1;

    /* Emit activity log entry every 3 ticks */
    if (tickRef.current % 3 === 0) {
      const logEntries: Record<SammyMood, string> = {
        idle:      'Running idle cycle — all systems nominal',
        working:   'Processing request queue...',
        thinking:  'Computing optimal response vectors...',
        excited:   'New data pattern detected — flagging for review',
        tired:     'Power management mode engaged',
        alert:     '⚠ Alert flagged — monitoring closely',
        happy:     'Task complete — logging success metrics',
      };
      setActivityLog(prev => [logEntries[mood], ...prev].slice(0, 8));
    }

    const ai = await fetchAIResponse(mood, lastEvent, historyRef.current);

    if (ai.response && ai.response !== response) {
      setResponse(ai.response);
      historyRef.current = [...historyRef.current, ai.response].slice(-8);
    }

    setConfidence(ai.confidence);
    setMood(ai.suggestedMood);
    setCurrentAction(MOOD_TO_ACTION[ai.suggestedMood]);
    setFloorEffect(MOOD_TO_FLOOR[ai.suggestedMood]);
  }, [mood, lastEvent, response]);

  /* ── Thinking interval ───────────────────────────────────────────── */
  useEffect(() => {
    const id = setInterval(think, 7000);
    return () => clearInterval(id);
  }, [think]);

  /* ── Random event injection ──────────────────────────────────────── */
  useEffect(() => {
    const id = setInterval(() => {
      if (Math.random() > 0.5) {
        const event = DEMO_EVENTS[Math.floor(Math.random() * DEMO_EVENTS.length)];
        setLastEvent(event);

        if (event.priority === 'high') {
          setMood('alert');
          setCurrentAction('alert');
          setFloorEffect('alarm');
        } else if (event.priority === 'medium') {
          setMood('thinking');
          setCurrentAction('thinking');
        }

        setActivityLog(prev => [
          `[${event.type.toUpperCase()}] ${event.message}`,
          ...prev,
        ].slice(0, 8));

        setTimeout(() => setLastEvent(null), 5000);
      }
    }, 15000);

    return () => clearInterval(id);
  }, []);

  /* ── Trigger a manual event (for external use) ─────────────────── */
  const triggerEvent = useCallback((event: EnvironmentEvent) => {
    setLastEvent(event);

    if (event.priority === 'high') {
      setMood('alert');
      setCurrentAction('alert');
      setFloorEffect('alarm');
    } else if (event.priority === 'medium') {
      setMood('working');
      setCurrentAction('typing');
      setFloorEffect('data-stream');
    } else {
      setMood('excited');
      setCurrentAction('celebrating');
      setFloorEffect('glow-pulse');
    }

    setActivityLog(prev => [
      `[${event.type.toUpperCase()}] ${event.message}`,
      ...prev,
    ].slice(0, 8));
  }, []);

  /* ── User command ───────────────────────────────────────────────── */
  const sendCommand = useCallback(async (command: string) => {
    setActivityLog(prev => [`[USER] ${command}`, ...prev].slice(0, 8));
    setMood('working');
    setCurrentAction('typing');
    setFloorEffect('data-stream');
    setCurrentTask(`Processing: "${command.slice(0, 30)}..."`);

    const ai = await fetchAIResponse(
      mood,
      { type: 'user', message: command, priority: 'high' },
      historyRef.current
    );

    setResponse(ai.response);
    setConfidence(ai.confidence);
    setMood(ai.suggestedMood);
    setCurrentAction(MOOD_TO_ACTION[ai.suggestedMood]);
    setFloorEffect(MOOD_TO_FLOOR[ai.suggestedMood]);
    setCurrentTask('Monitoring systems');
  }, [mood]);

  return {
    mood, currentTask, response, floorEffect,
    confidence, activityLog, currentAction,
    triggerEvent, sendCommand,
  };
}

/* ─── Floor Effect Visual ───────────────────────────────────────────── */
export function FloorEffect({ effect, mood }: { effect: FloorEffect; mood: string }) {
  const colors: Record<string, string> = {
    idle: '#00FFFF', working: '#00FF41', thinking: '#8B5CF6',
    excited: '#FFD700', tired: '#4FC3F7', alert: '#FF003C', happy: '#FF5C3A',
  };
  const c = colors[mood] || '#00FFFF';

  if (effect === 'none') return null;

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5 }}>
      {effect === 'ripple' && (
        <>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              position: 'absolute', bottom: 60, left: '50%',
              width: 120, height: 60,
              borderRadius: '50%',
              border: `1.5px solid ${c}55`,
              animation: `ripple-floor 2.5s infinite`,
              animationDelay: `${i * 0.85}s`,
              transform: 'translateX(-50%)',
            }} />
          ))}
        </>
      )}

      {effect === 'data-stream' && (
        <div style={{
          position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
          width: 300, height: 120,
          background: `radial-gradient(ellipse at bottom, ${c}20 0%, transparent 70%)`,
          animation: 'floor-pulse-glow 1.2s infinite',
          filter: 'blur(20px)',
        }} />
      )}

      {effect === 'glow-pulse' && (
        <div style={{
          position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
          width: 280, height: 100,
          background: `radial-gradient(ellipse at bottom, ${c}40 0%, transparent 70%)`,
          animation: 'ambient-floor 2s infinite',
          filter: 'blur(15px)',
        }} />
      )}

      {effect === 'alarm' && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'repeating-linear-gradient(0deg, transparent, transparent 30px, #FF003C10 30px, #FF003C10 60px)',
          animation: 'alarm-scan 0.4s infinite',
        }} />
      )}

      {effect === 'grid-hack' && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%',
          background: `repeating-linear-gradient(90deg, ${c}05 0px, ${c}05 1px, transparent 1px, transparent 40px),
                       repeating-linear-gradient(0deg, ${c}05 0px, ${c}05 1px, transparent 1px, transparent 40px)`,
          animation: 'grid-glitch 0.8s infinite',
        }} />
      )}
    </div>
  );
}
