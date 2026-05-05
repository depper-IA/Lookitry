-- backend/src/migrations/20260503_create_chat_tables.sql

CREATE TYPE conversation_status AS ENUM ('active', 'pending', 'closed');
CREATE TYPE message_sender_type AS ENUM ('lead', 'agent', 'bot');

CREATE TABLE lead_conversations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id uuid REFERENCES brands(id) ON DELETE SET NULL,
    status conversation_status DEFAULT 'pending',
    source varchar(20) DEFAULT 'whatsapp',
    platform_id text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE lead_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id uuid REFERENCES lead_conversations(id) ON DELETE CASCADE,
    sender_type message_sender_type NOT NULL,
    content text NOT NULL,
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now()
);

CREATE TABLE lead_attachments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id uuid REFERENCES lead_messages(id) ON DELETE CASCADE,
    file_url text NOT NULL,
    file_type varchar(50) NOT NULL,
    validation_result jsonb,
    created_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_lead_conversations_lead_id ON lead_conversations(lead_id);
CREATE INDEX idx_lead_conversations_status ON lead_conversations(status);
CREATE INDEX idx_lead_conversations_platform_id ON lead_conversations(platform_id);
CREATE INDEX idx_lead_messages_conversation_id ON lead_messages(conversation_id);
CREATE INDEX idx_lead_attachments_message_id ON lead_attachments(message_id);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_lead_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_lead_conversations_updated_at
    BEFORE UPDATE ON lead_conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_lead_conversations_updated_at();
