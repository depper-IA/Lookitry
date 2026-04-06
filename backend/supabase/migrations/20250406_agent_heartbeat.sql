-- Tabla para tracking en tiempo real de agentes activos
CREATE TABLE agent_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name TEXT NOT NULL UNIQUE,
  current_task_id UUID REFERENCES agent_activities(id),
  current_task_description TEXT,
  status TEXT NOT NULL DEFAULT 'idle', -- 'idle', 'working', 'error'
  last_heartbeat_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Índice para queries rápidas
CREATE INDEX idx_agent_sessions_agent_name ON agent_sessions(agent_name);
CREATE INDEX idx_agent_sessions_last_heartbeat ON agent_sessions(last_heartbeat_at DESC);

-- RLS Policies
ALTER TABLE agent_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read agent sessions"
  ON agent_sessions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role can manage sessions"
  ON agent_sessions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
