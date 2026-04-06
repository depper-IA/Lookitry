-- Migration: 20250406_agent_activities
-- Creado por: DataAlchemist
-- Sistema de tracking de actividad de agentes Lookitry

CREATE TABLE IF NOT EXISTS agent_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name TEXT NOT NULL,
  task_type TEXT NOT NULL,
  task_description TEXT,
  status TEXT NOT NULL DEFAULT 'running',
  duration_ms INTEGER,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);

-- Indexes para queries frecuentes
CREATE INDEX IF NOT EXISTS idx_agent_activities_agent_name ON agent_activities(agent_name);
CREATE INDEX IF NOT EXISTS idx_agent_activities_created_at ON agent_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_activities_status ON agent_activities(status);
CREATE INDEX IF NOT EXISTS idx_agent_activities_task_type ON agent_activities(task_type);
CREATE INDEX IF NOT EXISTS idx_agent_activities_synced_at ON agent_activities(created_at DESC) WHERE status != 'running';

-- RLS Policies
ALTER TABLE agent_activities ENABLE ROW LEVEL SECURITY;

-- Policy para admins (dashboard usa anon key pero hay auth)
CREATE POLICY "Admins can read all agent activities"
  ON agent_activities FOR SELECT
  TO authenticated
  USING (true);

-- Policy para inserción (Sammy y agentes usan service role)
CREATE POLICY "Service role can insert activities"
  ON agent_activities FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Policy para actualización (Sammy actualiza cuando termina tarea)
CREATE POLICY "Service role can update activities"
  ON agent_activities FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);