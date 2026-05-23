-- Migration: Add rebecca_message_ratings table
-- Purpose: Human-in-the-loop feedback for Rebecca conversations

CREATE TABLE IF NOT EXISTS rebecca_message_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
    message_index INTEGER NOT NULL,
    message_content TEXT NOT NULL,
    rebecca_response TEXT,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    rating_label TEXT CHECK (rating_label IN ('thumbs_up', 'thumbs_down')),
    lead_intent TEXT,
    conversation_outcome TEXT CHECK (conversation_outcome IN ('converted', 'abandoned', 'pending')),
    admin_reviewed BOOLEAN DEFAULT FALSE,
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_ratings_session ON rebecca_message_ratings(session_id);
CREATE INDEX IF NOT EXISTS idx_ratings_created ON rebecca_message_ratings(created_at);
CREATE INDEX IF NOT EXISTS idx_ratings_admin_reviewed ON rebecca_message_ratings(admin_reviewed) WHERE admin_reviewed = FALSE;
CREATE INDEX IF NOT EXISTS idx_ratings_rating ON rebecca_message_ratings(rating);
CREATE INDEX IF NOT EXISTS idx_ratings_brand ON rebecca_message_ratings(brand_id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_rebecca_message_ratings_updated_at
    BEFORE UPDATE ON rebecca_message_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE rebecca_message_ratings IS 'Feedback ratings for Rebecca messages. Thumbs up/down + 1-5 scale.';
COMMENT ON COLUMN rebecca_message_ratings.rating_label IS 'Simplified label: thumbs_up or thumbs_down';
COMMENT ON COLUMN rebecca_message_ratings.admin_reviewed IS 'Mark as TRUE when admin has reviewed and taken action';