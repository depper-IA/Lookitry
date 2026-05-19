-- Migration: 20260518_whatsapp_agent_migration.sql
-- Phase 1: Database Tasks for WhatsApp Agent

-- Task 1.1: Verify leads table + add WhatsApp columns
ALTER TABLE leads ADD COLUMN IF NOT EXISTS whatsapp_status VARCHAR(20) DEFAULT 'new';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS whatsapp_conversation JSONB DEFAULT '[]';

-- Task 1.2: Create lead_conversations table
CREATE TYPE conversation_status AS ENUM ('active', 'pending', 'closed');
CREATE TYPE message_sender_type AS ENUM ('lead', 'agent', 'bot');

CREATE TABLE IF NOT EXISTS lead_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES brands(id) ON DELETE SET NULL,
    status conversation_status DEFAULT 'pending',
    source VARCHAR(20) DEFAULT 'whatsapp',
    platform_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_lead_conversations_lead_id ON lead_conversations(lead_id);
CREATE INDEX idx_lead_conversations_status ON lead_conversations(status);
CREATE INDEX idx_lead_conversations_platform_id ON lead_conversations(platform_id);

CREATE OR REPLACE FUNCTION update_lead_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_lead_conversations_updated_at
    BEFORE UPDATE ON lead_conversations FOR EACH ROW
    EXECUTE FUNCTION update_lead_conversations_updated_at();

-- Task 1.3: Create lead_messages table
CREATE TABLE IF NOT EXISTS lead_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES lead_conversations(id) ON DELETE CASCADE,
    sender_type message_sender_type NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_lead_messages_conversation_id ON lead_messages(conversation_id);

-- Task 1.4: Create RPC search_lookitry_knowledge (CRITICAL)
CREATE OR REPLACE FUNCTION search_lookitry_knowledge(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 5
)
RETURNS TABLE (id text, content text, category text, similarity float) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    lookitry_knowledge.id,
    lookitry_knowledge.content,
    lookitry_knowledge.category,
    1 - (lookitry_knowledge.embedding <=> query_embedding) AS similarity
  FROM lookitry_knowledge
  WHERE lookitry_knowledge.is_active = true
    AND 1 - (lookitry_knowledge.embedding <=> query_embedding) > match_threshold
  ORDER BY lookitry_knowledge.embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- Task 1.5: Enable RLS on new tables
ALTER TABLE lead_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for service role" ON lead_conversations
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Allow all for service role" ON lead_messages
  FOR ALL USING (auth.role() = 'service_role');
