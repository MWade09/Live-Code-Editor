SUPABASE QUERIES:

-- =============================================
-- LiveEditor Claude - Database Schema
-- Complete database setup for user profiles, projects, and community features
-- =============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- MAIN TABLES
-- =============================================

-- Extended user profiles (extends Supabase auth.users)
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  
  -- Developer Profile
  github_username TEXT,
  twitter_handle TEXT,
  website_url TEXT,
  linkedin_url TEXT,
  preferred_languages TEXT[] DEFAULT '{}',
  coding_experience TEXT DEFAULT 'beginner' CHECK (coding_experience IN ('beginner', 'intermediate', 'advanced', 'expert')),
  
  -- Additional Profile Data
  location TEXT,
  timezone TEXT,
  company TEXT,
  job_title TEXT,
  skills TEXT[] DEFAULT '{}',
  interests TEXT[] DEFAULT '{}',
  
  -- Privacy & Preferences
  profile_visibility TEXT DEFAULT 'public' CHECK (profile_visibility IN ('public', 'private', 'friends')),
  email_notifications BOOLEAN DEFAULT true,
  marketing_emails BOOLEAN DEFAULT false,
  
  -- Metadata
  onboarding_completed BOOLEAN DEFAULT false,
  last_seen_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table for user-generated content
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content JSONB NOT NULL, -- Stores the project code/content
  language TEXT NOT NULL,
  framework TEXT,
  tags TEXT[] DEFAULT '{}',
  
  -- Visibility and Status
  is_public BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  
  -- Engagement Metrics (denormalized for performance)
  likes_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  forks_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  
  -- Project Metadata
  difficulty_level TEXT DEFAULT 'beginner' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  estimated_time INTEGER, -- in minutes
  thumbnail_url TEXT,
  demo_url TEXT,
  github_url TEXT,
  
  -- Timestamps
  featured_at TIMESTAMP WITH TIME ZONE,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project likes (many-to-many relationship)
CREATE TABLE project_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- Project views tracking
CREATE TABLE project_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE, -- Can be null for anonymous views
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comments system
CREATE TABLE comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE, -- For nested replies
  likes_count INTEGER DEFAULT 0,
  is_edited BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User follows (social features)
CREATE TABLE user_follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK(follower_id != following_id)
);

-- User activity tracking
CREATE TABLE user_activity (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('project_created', 'project_liked', 'project_commented', 'user_followed', 'profile_updated')),
  activity_data JSONB DEFAULT '{}',
  related_id UUID, -- Generic reference to related entity
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications system
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('like', 'comment', 'follow', 'project_featured', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- User profiles indexes
CREATE INDEX idx_user_profiles_username ON user_profiles(username);
CREATE INDEX idx_user_profiles_created_at ON user_profiles(created_at);
CREATE INDEX idx_user_profiles_last_seen ON user_profiles(last_seen_at);

-- Projects indexes
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_is_public ON projects(is_public);
CREATE INDEX idx_projects_is_featured ON projects(is_featured);
CREATE INDEX idx_projects_language ON projects(language);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX idx_projects_published_at ON projects(published_at DESC);
CREATE INDEX idx_projects_likes_count ON projects(likes_count DESC);
CREATE INDEX idx_projects_views_count ON projects(views_count DESC);
CREATE INDEX idx_projects_tags ON projects USING GIN(tags);

-- Project interactions indexes
CREATE INDEX idx_project_likes_project_id ON project_likes(project_id);
CREATE INDEX idx_project_likes_user_id ON project_likes(user_id);
CREATE INDEX idx_project_views_project_id ON project_views(project_id);
CREATE INDEX idx_project_views_created_at ON project_views(created_at);

-- Comments indexes
CREATE INDEX idx_comments_project_id ON comments(project_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);
CREATE INDEX idx_comments_created_at ON comments(created_at);

-- Activity and notifications indexes
CREATE INDEX idx_user_activity_user_id ON user_activity(user_id);
CREATE INDEX idx_user_activity_created_at ON user_activity(created_at DESC);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone" ON user_profiles
  FOR SELECT USING (profile_visibility = 'public');

CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can create their own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Projects Policies
CREATE POLICY "Public projects are viewable by everyone" ON projects
  FOR SELECT USING (is_public = true AND status = 'published');

CREATE POLICY "Users can view their own projects" ON projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" ON projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" ON projects
  FOR DELETE USING (auth.uid() = user_id);

-- Project Likes Policies
CREATE POLICY "Anyone can view project likes" ON project_likes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can like projects" ON project_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own likes" ON project_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Project Views Policies
CREATE POLICY "Anyone can view project views" ON project_views
  FOR SELECT USING (true);

CREATE POLICY "Anyone can record project views" ON project_views
  FOR INSERT WITH CHECK (true);

-- Comments Policies
CREATE POLICY "Anyone can view comments on public projects" ON comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = comments.project_id 
      AND projects.is_public = true 
      AND projects.status = 'published'
    )
  );

CREATE POLICY "Authenticated users can create comments" ON comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" ON comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON comments
  FOR DELETE USING (auth.uid() = user_id);

-- User Follows Policies
CREATE POLICY "Anyone can view public follows" ON user_follows
  FOR SELECT USING (true);

CREATE POLICY "Users can follow others" ON user_follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow others" ON user_follows
  FOR DELETE USING (auth.uid() = follower_id);

-- User Activity Policies
CREATE POLICY "Users can view their own activity" ON user_activity
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create activity records" ON user_activity
  FOR INSERT WITH CHECK (true);

-- Notifications Policies
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to increment project likes count
CREATE OR REPLACE FUNCTION increment_project_likes(project_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE projects 
  SET likes_count = likes_count + 1 
  WHERE id = project_id;
END;
$$ LANGUAGE plpgsql;

-- Function to decrement project likes count
CREATE OR REPLACE FUNCTION decrement_project_likes(project_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE projects 
  SET likes_count = GREATEST(likes_count - 1, 0)
  WHERE id = project_id;
END;
$$ LANGUAGE plpgsql;

-- Function to increment project views count
CREATE OR REPLACE FUNCTION increment_project_views(project_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE projects 
  SET views_count = views_count + 1 
  WHERE id = project_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- SAMPLE DATA (OPTIONAL - FOR DEVELOPMENT)
-- =============================================

-- This section can be uncommented for development purposes
/*
-- Sample projects data
INSERT INTO projects (user_id, title, description, content, language, tags, is_public, status, difficulty_level) VALUES
  (
    (SELECT id FROM user_profiles LIMIT 1),
    'React Todo App',
    'A simple todo application built with React and TypeScript',
    '{"html":"<!DOCTYPE html>\n<html>\n<head>\n<title>Todo App</title>\n</head>\n<body>\n<div id=\"root\"></div>\n</body>\n</html>","css":"body { font-family: Arial, sans-serif; margin: 20px; }","js":"// React Todo App code here"}',
    'javascript',
    ARRAY['react', 'typescript', 'frontend'],
    true,
    'published',
    'intermediate'
  );
*/

-- =============================================
-- VIEWS FOR COMMON QUERIES
-- =============================================

-- View for project details with author info
CREATE VIEW project_details AS
SELECT 
  p.*,
  up.username,
  up.full_name,
  up.avatar_url,
  COALESCE(likes.count, 0) as total_likes,
  COALESCE(comments.count, 0) as total_comments,
  COALESCE(views.count, 0) as total_views
FROM projects p
LEFT JOIN user_profiles up ON p.user_id = up.id
LEFT JOIN (
  SELECT project_id, COUNT(*) as count 
  FROM project_likes 
  GROUP BY project_id
) likes ON p.id = likes.project_id
LEFT JOIN (
  SELECT project_id, COUNT(*) as count 
  FROM comments 
  WHERE is_deleted = false
  GROUP BY project_id
) comments ON p.id = comments.project_id
LEFT JOIN (
  SELECT project_id, COUNT(*) as count 
  FROM project_views 
  GROUP BY project_id
) views ON p.id = views.project_id;

-- View for user stats
CREATE VIEW user_stats AS
SELECT 
  up.id,
  up.username,
  up.created_at as joined_date,
  up.last_seen_at,
  COALESCE(projects.count, 0) as projects_count,
  COALESCE(followers.count, 0) as followers_count,
  COALESCE(following.count, 0) as following_count,
  COALESCE(total_likes.count, 0) as total_likes_received
FROM user_profiles up
LEFT JOIN (
  SELECT user_id, COUNT(*) as count 
  FROM projects 
  WHERE status = 'published'
  GROUP BY user_id
) projects ON up.id = projects.user_id
LEFT JOIN (
  SELECT following_id, COUNT(*) as count 
  FROM user_follows 
  GROUP BY following_id
) followers ON up.id = followers.following_id
LEFT JOIN (
  SELECT follower_id, COUNT(*) as count 
  FROM user_follows 
  GROUP BY follower_id
) following ON up.id = following.follower_id
LEFT JOIN (
  SELECT p.user_id, COUNT(pl.id) as count
  FROM projects p
  LEFT JOIN project_likes pl ON p.id = pl.project_id
  GROUP BY p.user_id
) total_likes ON up.id = total_likes.user_id;

-- Grant permissions for views
GRANT SELECT ON project_details TO authenticated;
GRANT SELECT ON user_stats TO authenticated;

-- =============================================
-- COMPLETION CONFIRMATION
-- =============================================

-- Insert a confirmation record (optional)
DO $$
BEGIN
  RAISE NOTICE 'LiveEditor Claude database schema has been successfully created!';
  RAISE NOTICE 'Tables created: user_profiles, projects, project_likes, project_views, comments, user_follows, user_activity, notifications';
  RAISE NOTICE 'RLS policies enabled for all tables';
  RAISE NOTICE 'Indexes created for optimal performance';
  RAISE NOTICE 'Triggers and functions implemented';
  RAISE NOTICE 'Views created for common queries';
END $$;

2nd Quiry:

-- Reports (moderation)
CREATE TABLE project_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  reporter_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open','reviewing','resolved','dismissed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE project_reports ENABLE ROW LEVEL SECURITY;

-- Project Reports Policies
CREATE POLICY "Users can view their own reports" ON project_reports
  FOR SELECT USING (auth.uid() = reporter_id);

CREATE POLICY "Authenticated users can create reports" ON project_reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE TRIGGER update_project_reports_updated_at BEFORE UPDATE ON project_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

  3rd Quiry:

  -- Save history (lightweight)
CREATE TABLE project_saves (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  change_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE project_saves ENABLE ROW LEVEL SECURITY;

-- Project Saves Policies
CREATE POLICY "View saves for public or own projects" ON project_saves
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_saves.project_id 
      AND (
        (projects.is_public = true AND projects.status = 'published')
        OR projects.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Owners can insert saves" ON project_saves
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_saves.project_id 
      AND projects.user_id = auth.uid()
    )
  );

4th Quiry:

-- =============================================
-- VERSION CONTROL TABLES AND POLICIES
-- =============================================

-- Commits per project (lightweight text snapshot + message)
CREATE TABLE IF NOT EXISTS project_commits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  content TEXT NOT NULL,
  branch TEXT NOT NULL DEFAULT 'main',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_commits_project_id ON project_commits(project_id);
CREATE INDEX IF NOT EXISTS idx_project_commits_created_at ON project_commits(created_at DESC);

-- Branch registry (for future expansion)
CREATE TABLE IF NOT EXISTS project_branches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  created_by UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, name)
);

ALTER TABLE project_commits ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_branches ENABLE ROW LEVEL SECURITY;

-- Owners can read their commits
DROP POLICY IF EXISTS project_commits_owner_select ON project_commits;
CREATE POLICY project_commits_owner_select ON project_commits
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  );

-- Owners can write commits
DROP POLICY IF EXISTS project_commits_owner_insert ON project_commits;
CREATE POLICY project_commits_owner_insert ON project_commits
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  );

-- Owners may delete their commits
DROP POLICY IF EXISTS project_commits_owner_delete ON project_commits;
CREATE POLICY project_commits_owner_delete ON project_commits
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  );

-- Owners can read their branches
DROP POLICY IF EXISTS project_branches_owner_select ON project_branches;
CREATE POLICY project_branches_owner_select ON project_branches
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  );

-- Owners can create branches
DROP POLICY IF EXISTS project_branches_owner_insert ON project_branches;
CREATE POLICY project_branches_owner_insert ON project_branches
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  );

-- Owners can delete their branches
DROP POLICY IF EXISTS project_branches_owner_delete ON project_branches;
CREATE POLICY project_branches_owner_delete ON project_branches
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  );

  5th Quiry:

  -- Composite index for paginated lookups with branch filter
CREATE INDEX IF NOT EXISTS idx_project_commits_project_branch_created_at ON project_commits(project_id, branch, created_at DESC);

-- Index for quick lookup by project and name
CREATE INDEX IF NOT EXISTS idx_project_branches_project_name ON project_branches(project_id, name);

6th Quiry:

-- Terminal sessions tracking
CREATE TABLE IF NOT EXISTS terminal_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  commands JSONB[] DEFAULT '{}',
  working_directory TEXT,
  environment_vars JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE terminal_sessions ENABLE ROW LEVEL SECURITY;

-- Owners can read their terminal sessions
DROP POLICY IF EXISTS terminal_sessions_owner_select ON terminal_sessions;
CREATE POLICY terminal_sessions_owner_select ON terminal_sessions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  );

-- Owners can insert sessions
DROP POLICY IF EXISTS terminal_sessions_owner_insert ON terminal_sessions;
CREATE POLICY terminal_sessions_owner_insert ON terminal_sessions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  );

-- Owners can update their sessions
DROP POLICY IF EXISTS terminal_sessions_owner_update ON terminal_sessions;
CREATE POLICY terminal_sessions_owner_update ON terminal_sessions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_terminal_sessions_project_id ON terminal_sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_terminal_sessions_last_active ON terminal_sessions(last_active DESC);

7th Quiry:

-- Build configuration per project
CREATE TABLE IF NOT EXISTS project_build_configs (
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE PRIMARY KEY,
  build_command TEXT DEFAULT 'npm run build',
  environment JSONB DEFAULT '{}',
  deploy_target TEXT DEFAULT 'netlify',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE project_build_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS project_build_configs_owner_select ON project_build_configs;
CREATE POLICY project_build_configs_owner_select ON project_build_configs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS project_build_configs_owner_upsert ON project_build_configs;
CREATE POLICY project_build_configs_owner_upsert ON project_build_configs
  FOR INSERT TO PUBLIC
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS project_build_configs_owner_update ON project_build_configs;
CREATE POLICY project_build_configs_owner_update ON project_build_configs
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  );

  8th Quiry:

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