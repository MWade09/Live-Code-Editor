-- =====================================================
-- Project Embeddings Migration
-- Phase 2: Intelligence - Semantic Search & Context
-- =====================================================

-- Enable pgvector extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS vector;

-- =====================================================
-- project_embeddings table
-- Stores vectorized chunks of project files
-- =====================================================
CREATE TABLE IF NOT EXISTS project_embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Project reference
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    
    -- File identification
    file_path TEXT NOT NULL,
    chunk_index INTEGER NOT NULL DEFAULT 0,
    
    -- Content storage
    content TEXT NOT NULL,
    content_hash TEXT, -- SHA-256 hash for change detection
    
    -- Vector embedding (1536 dimensions for text-embedding-3-small)
    embedding vector(1536),
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint per file chunk
    UNIQUE(project_id, file_path, chunk_index)
);

-- =====================================================
-- Indexes for performance
-- =====================================================

-- Index for project lookups
CREATE INDEX IF NOT EXISTS idx_embeddings_project_id 
    ON project_embeddings(project_id);

-- Index for file lookups within a project
CREATE INDEX IF NOT EXISTS idx_embeddings_project_file 
    ON project_embeddings(project_id, file_path);

-- Index for similarity search using IVFFlat
-- (Requires at least 1000 rows for optimal performance)
CREATE INDEX IF NOT EXISTS idx_embeddings_vector 
    ON project_embeddings 
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- Index on content hash for change detection
CREATE INDEX IF NOT EXISTS idx_embeddings_content_hash 
    ON project_embeddings(content_hash);

-- =====================================================
-- Update projects table for embeddings metadata
-- =====================================================
ALTER TABLE projects 
    ADD COLUMN IF NOT EXISTS embeddings_updated_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS embeddings_count INTEGER DEFAULT 0;

-- =====================================================
-- Function for similarity search
-- =====================================================
CREATE OR REPLACE FUNCTION search_embeddings(
    p_project_id UUID,
    p_query_embedding vector(1536),
    p_match_count INTEGER DEFAULT 5,
    p_match_threshold FLOAT DEFAULT 0.5
)
RETURNS TABLE (
    id UUID,
    file_path TEXT,
    chunk_index INTEGER,
    content TEXT,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pe.id,
        pe.file_path,
        pe.chunk_index,
        pe.content,
        1 - (pe.embedding <=> p_query_embedding) as similarity
    FROM project_embeddings pe
    WHERE pe.project_id = p_project_id
        AND pe.embedding IS NOT NULL
        AND 1 - (pe.embedding <=> p_query_embedding) > p_match_threshold
    ORDER BY pe.embedding <=> p_query_embedding
    LIMIT p_match_count;
END;
$$;

-- =====================================================
-- Function to get file embeddings by hash (for caching)
-- =====================================================
CREATE OR REPLACE FUNCTION get_embeddings_by_hash(
    p_project_id UUID,
    p_file_path TEXT,
    p_content_hash TEXT
)
RETURNS TABLE (
    chunk_index INTEGER,
    content TEXT,
    embedding vector(1536)
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pe.chunk_index,
        pe.content,
        pe.embedding
    FROM project_embeddings pe
    WHERE pe.project_id = p_project_id
        AND pe.file_path = p_file_path
        AND pe.content_hash = p_content_hash
    ORDER BY pe.chunk_index;
END;
$$;

-- =====================================================
-- Trigger to auto-update updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_embeddings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS embeddings_updated_at ON project_embeddings;
CREATE TRIGGER embeddings_updated_at
    BEFORE UPDATE ON project_embeddings
    FOR EACH ROW
    EXECUTE FUNCTION update_embeddings_updated_at();

-- =====================================================
-- Row Level Security (RLS)
-- =====================================================
ALTER TABLE project_embeddings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view embeddings for public projects or their own
CREATE POLICY "Users can view own or public project embeddings"
    ON project_embeddings
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = project_embeddings.project_id
            AND (p.is_public = true OR p.user_id = auth.uid())
        )
    );

-- Policy: Users can insert embeddings for their own projects
CREATE POLICY "Users can insert own project embeddings"
    ON project_embeddings
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = project_embeddings.project_id
            AND p.user_id = auth.uid()
        )
    );

-- Policy: Users can update embeddings for their own projects
CREATE POLICY "Users can update own project embeddings"
    ON project_embeddings
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = project_embeddings.project_id
            AND p.user_id = auth.uid()
        )
    );

-- Policy: Users can delete embeddings for their own projects
CREATE POLICY "Users can delete own project embeddings"
    ON project_embeddings
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = project_embeddings.project_id
            AND p.user_id = auth.uid()
        )
    );

-- Service role bypass for API routes
CREATE POLICY "Service role full access to embeddings"
    ON project_embeddings
    FOR ALL
    USING (auth.role() = 'service_role');

-- =====================================================
-- Comments for documentation
-- =====================================================
COMMENT ON TABLE project_embeddings IS 'Stores vector embeddings for project file chunks to enable semantic search';
COMMENT ON COLUMN project_embeddings.embedding IS 'OpenAI text-embedding-3-small vector (1536 dimensions)';
COMMENT ON COLUMN project_embeddings.content_hash IS 'SHA-256 hash of content for change detection';
COMMENT ON FUNCTION search_embeddings IS 'Performs cosine similarity search on project embeddings';
