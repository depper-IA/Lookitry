-- ============================================
-- Migration: Create project_knowledge table for RAG
-- Purpose: Store embeddings of core project documentation for AI agents
-- Created: 2026-04-09
-- ============================================

-- Enable pgvector extension if not exists
CREATE EXTENSION IF NOT EXISTS vector;

-- Table for storing project documentation embeddings
CREATE TABLE IF NOT EXISTS project_knowledge (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    content TEXT NOT NULL,
    content_hash TEXT NOT NULL,  -- SHA256 hash to detect changes
    embedding vector(768),       -- Gemini embedding dimension
    version TEXT,                 -- Commit SHA or date
    doc_type TEXT NOT NULL,       -- 'PRD', 'DESIGN', 'TECH_STACK', 'REGLAS', 'CHANGELOG', 'OTHER'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint on file_path to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_project_knowledge_file_path ON project_knowledge(file_path);

-- GIN index for vector similarity search (IVFFlat for approximate nearest neighbor)
CREATE INDEX IF NOT EXISTS idx_project_knowledge_embedding 
ON project_knowledge USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Index for filtering by doc_type
CREATE INDEX IF NOT EXISTS idx_project_knowledge_doc_type ON project_knowledge(doc_type);

-- Index for finding by file_name
CREATE INDEX IF NOT EXISTS idx_project_knowledge_file_name ON project_knowledge(file_name);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_project_knowledge_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_project_knowledge_updated_at ON project_knowledge;
CREATE TRIGGER trigger_project_knowledge_updated_at
    BEFORE UPDATE ON project_knowledge
    FOR EACH ROW
    EXECUTE FUNCTION update_project_knowledge_timestamp();

-- RPC function for upserting knowledge with embedding
CREATE OR REPLACE FUNCTION upsert_project_knowledge(
    p_file_name TEXT,
    p_file_path TEXT,
    p_content TEXT,
    p_content_hash TEXT,
    p_embedding vector(768),
    p_version TEXT,
    p_doc_type TEXT
)
RETURNS TABLE(
    id UUID,
    inserted BOOLEAN,
    updated BOOLEAN
) AS $$
DECLARE
    v_existing_id UUID;
    v_is_update BOOLEAN := FALSE;
    v_inserted_id UUID;
BEGIN
    -- Check if record exists with same file_path
    SELECT id INTO v_existing_id 
    FROM project_knowledge 
    WHERE file_path = p_file_path;
    
    IF v_existing_id IS NOT NULL THEN
        -- Update existing record
        v_is_update := TRUE;
        UPDATE project_knowledge SET
            file_name = p_file_name,
            content = p_content,
            content_hash = p_content_hash,
            embedding = p_embedding,
            version = p_version,
            doc_type = p_doc_type,
            updated_at = NOW()
        WHERE id = v_existing_id;
        
        RETURN QUERY SELECT v_existing_id, FALSE, TRUE;
    ELSE
        -- Insert new record
        INSERT INTO project_knowledge (
            file_name, file_path, content, content_hash, 
            embedding, version, doc_type
        ) VALUES (
            p_file_name, p_file_path, p_content, p_content_hash,
            p_embedding, p_version, p_doc_type
        ) RETURNING id INTO v_inserted_id;
        
        RETURN QUERY SELECT v_inserted_id, TRUE, FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC function for semantic search
CREATE OR REPLACE FUNCTION search_project_knowledge(
    p_query_embedding vector(768),
    p_match_count INT DEFAULT 5,
    p_doc_type_filter TEXT DEFAULT NULL
)
RETURNS TABLE(
    id UUID,
    file_name TEXT,
    file_path TEXT,
    content TEXT,
    doc_type TEXT,
    version TEXT,
    similarity FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pk.id,
        pk.file_name,
        pk.file_path,
        pk.content,
        pk.doc_type,
        pk.version,
        1 - (pk.embedding <=> p_query_embedding) AS similarity
    FROM project_knowledge pk
    WHERE pk.embedding IS NOT NULL
      AND (p_doc_type_filter IS NULL OR pk.doc_type = p_doc_type_filter)
    ORDER BY pk.embedding <=> p_query_embedding
    LIMIT p_match_count;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions (adjust as needed for your role setup)
-- GRANT SELECT, INSERT, UPDATE ON project_knowledge TO authenticated;
-- GRANT EXECUTE ON FUNCTION upsert_project_knowledge TO authenticated;
-- GRANT EXECUTE ON FUNCTION search_project_knowledge TO authenticated;

COMMENT ON TABLE project_knowledge IS 'RAG knowledge base for project documentation - indexed for AI agent queries';
COMMENT ON COLUMN project_knowledge.embedding IS 'Gemini text-embedding-001 output, 768 dimensions';
COMMENT ON COLUMN project_knowledge.content_hash IS 'SHA256 hash of content to efficiently detect changes';
