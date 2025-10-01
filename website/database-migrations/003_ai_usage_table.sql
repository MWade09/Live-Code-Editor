-- AI Usage Tracking Table
-- Tracks API usage for billing and analytics

CREATE TABLE IF NOT EXISTS public.ai_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    model TEXT NOT NULL,
    tokens_used INTEGER NOT NULL DEFAULT 0,
    cost_usd DECIMAL(10, 6) NOT NULL DEFAULT 0,
    markup_usd DECIMAL(10, 6) NOT NULL DEFAULT 0,
    total_usd DECIMAL(10, 6) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS ai_usage_user_id_idx ON public.ai_usage(user_id);
CREATE INDEX IF NOT EXISTS ai_usage_created_at_idx ON public.ai_usage(created_at DESC);
CREATE INDEX IF NOT EXISTS ai_usage_user_created_idx ON public.ai_usage(user_id, created_at DESC);

-- Row Level Security
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

-- Users can only view their own usage
CREATE POLICY "Users can view their own usage"
    ON public.ai_usage
    FOR SELECT
    USING (auth.uid() = user_id);

-- Only the service (backend API) can insert usage records
-- This requires service role key, not accessible from client
CREATE POLICY "Service can insert usage records"
    ON public.ai_usage
    FOR INSERT
    WITH CHECK (true);

-- Admins can view all usage
CREATE POLICY "Admins can view all usage"
    ON public.ai_usage
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

COMMENT ON TABLE public.ai_usage IS 'Tracks AI API usage for billing and analytics';
COMMENT ON COLUMN public.ai_usage.tokens_used IS 'Total tokens used in the request';
COMMENT ON COLUMN public.ai_usage.cost_usd IS 'Base API cost in USD';
COMMENT ON COLUMN public.ai_usage.markup_usd IS 'Platform markup (20%) in USD';
COMMENT ON COLUMN public.ai_usage.total_usd IS 'Total cost charged to user in USD';
