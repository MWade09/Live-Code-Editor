-- =============================================
-- Phase 6: Project Memory System Migration
-- Cursor-Level AI Roadmap
-- =============================================
-- This migration adds the project_memory table for 
-- storing cross-session AI memories and learned patterns.

-- Create the project_memory table
CREATE TABLE IF NOT EXISTS project_memory (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Foreign keys
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Memory content
    memory_type VARCHAR(50) NOT NULL CHECK (memory_type IN ('conversation', 'explicit', 'learned')),
    content TEXT NOT NULL,
    
    -- Vector embedding for semantic search (1536 dimensions for OpenAI embeddings)
    embedding vector(1536),
    
    -- Importance score (0.0 to 1.0)
    importance FLOAT DEFAULT 0.5 CHECK (importance >= 0 AND importance <= 1),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Metadata (JSON for flexibility)
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_project_memory_project_id ON project_memory(project_id);
CREATE INDEX IF NOT EXISTS idx_project_memory_user_id ON project_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_project_memory_type ON project_memory(memory_type);
CREATE INDEX IF NOT EXISTS idx_project_memory_importance ON project_memory(importance DESC);
CREATE INDEX IF NOT EXISTS idx_project_memory_created_at ON project_memory(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_project_memory_last_accessed ON project_memory(last_accessed DESC);

-- Create vector index for similarity search (using ivfflat for efficiency)
-- Note: Requires pgvector extension
CREATE INDEX IF NOT EXISTS idx_project_memory_embedding ON project_memory 
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- Enable Row Level Security
ALTER TABLE project_memory ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own memories
CREATE POLICY "Users can view own memories" 
    ON project_memory FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own memories" 
    ON project_memory FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own memories" 
    ON project_memory FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own memories" 
    ON project_memory FOR DELETE 
    USING (auth.uid() = user_id);

-- Function to search memories by similarity
CREATE OR REPLACE FUNCTION search_project_memories(
    p_project_id UUID,
    p_query_embedding vector(1536),
    p_limit INT DEFAULT 5,
    p_min_similarity FLOAT DEFAULT 0.3
)
RETURNS TABLE (
    id UUID,
    memory_type VARCHAR(50),
    content TEXT,
    importance FLOAT,
    created_at TIMESTAMP WITH TIME ZONE,
    similarity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pm.id,
        pm.memory_type,
        pm.content,
        pm.importance,
        pm.created_at,
        1 - (pm.embedding <=> p_query_embedding) AS similarity
    FROM project_memory pm
    WHERE pm.project_id = p_project_id
      AND pm.user_id = auth.uid()
      AND pm.embedding IS NOT NULL
      AND 1 - (pm.embedding <=> p_query_embedding) >= p_min_similarity
    ORDER BY pm.embedding <=> p_query_embedding
    LIMIT p_limit;
END;
$$;

-- Function to decay old memories
CREATE OR REPLACE FUNCTION decay_old_memories()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Reduce importance for memories not accessed in 30+ days
    UPDATE project_memory
    SET importance = importance * 0.8
    WHERE last_accessed < NOW() - INTERVAL '30 days'
      AND importance > 0.1;
    
    -- Delete memories with very low importance
    DELETE FROM project_memory
    WHERE importance < 0.1
      AND last_accessed < NOW() - INTERVAL '60 days';
END;
$$;

-- Create a scheduled job for memory decay (if pg_cron is available)
-- SELECT cron.schedule('decay-memories', '0 0 * * *', 'SELECT decay_old_memories()');

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON project_memory TO authenticated;

-- Add comment for documentation
COMMENT ON TABLE project_memory IS 'Stores AI memories for cross-session continuity - Phase 6 Cursor-Level AI';
COMMENT ON COLUMN project_memory.memory_type IS 'Type of memory: conversation (auto-summarized), explicit (user-created), learned (AI-discovered patterns)';
COMMENT ON COLUMN project_memory.embedding IS 'Vector embedding for semantic search using pgvector';
COMMENT ON COLUMN project_memory.importance IS 'Memory importance score (0.0-1.0), decays over time if not accessed';
