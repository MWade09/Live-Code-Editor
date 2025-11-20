-- =============================================
-- COMMUNITY FEATURES DATABASE SCHEMA
-- Adds discussion system, gamification, and community enhancements
-- Created: November 20, 2025
-- =============================================

-- =============================================
-- DISCUSSION SYSTEM
-- =============================================

-- Discussion channels/categories (like Discord channels or forum categories)
CREATE TABLE IF NOT EXISTS discussion_channels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT, -- Icon name or emoji
  color TEXT, -- Hex color for UI theming
  position INTEGER DEFAULT 0, -- For custom ordering
  is_default BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  
  -- Permissions
  requires_role TEXT DEFAULT 'user' CHECK (requires_role IN ('user', 'admin', 'moderator')),
  
  -- Metadata
  created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Main discussion threads (separate from project comments)
CREATE TABLE IF NOT EXISTS discussions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID REFERENCES discussion_channels(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Content
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  
  -- Status
  is_pinned BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  
  -- Engagement (denormalized for performance)
  views_count INTEGER DEFAULT 0,
  replies_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  
  -- Best answer (for Q&A discussions)
  has_accepted_answer BOOLEAN DEFAULT false,
  accepted_answer_id UUID,
  
  -- Metadata
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Discussion replies (threaded comments)
CREATE TABLE IF NOT EXISTS discussion_replies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  discussion_id UUID REFERENCES discussions(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES discussion_replies(id) ON DELETE CASCADE, -- For nested replies
  
  -- Content
  content TEXT NOT NULL,
  
  -- Status
  is_accepted_answer BOOLEAN DEFAULT false, -- For marking best answer
  is_edited BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  
  -- Engagement
  likes_count INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Discussion likes
CREATE TABLE IF NOT EXISTS discussion_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  discussion_id UUID REFERENCES discussions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(discussion_id, user_id)
);

-- Discussion reply likes
CREATE TABLE IF NOT EXISTS discussion_reply_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reply_id UUID REFERENCES discussion_replies(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(reply_id, user_id)
);

-- Discussion views tracking
CREATE TABLE IF NOT EXISTS discussion_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  discussion_id UUID REFERENCES discussions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE, -- Can be null for anonymous
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Discussion subscriptions (for notifications)
CREATE TABLE IF NOT EXISTS discussion_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  discussion_id UUID REFERENCES discussions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  notify_on_reply BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(discussion_id, user_id)
);

-- =============================================
-- GAMIFICATION SYSTEM
-- =============================================

-- Badge definitions (achievements users can earn)
CREATE TABLE IF NOT EXISTS badge_definitions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  icon TEXT, -- Icon name or emoji
  color TEXT, -- Badge color/rarity
  category TEXT NOT NULL CHECK (category IN ('contribution', 'social', 'skill', 'milestone', 'special')),
  
  -- Earning criteria
  criteria_type TEXT NOT NULL CHECK (criteria_type IN ('manual', 'projects_count', 'likes_received', 'comments_count', 'followers_count', 'streak_days', 'discussion_count', 'helpful_answers')),
  criteria_value INTEGER, -- Threshold to earn badge
  
  -- Display
  rarity TEXT DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  points_value INTEGER DEFAULT 0, -- Points awarded when earned
  position INTEGER DEFAULT 0, -- For ordering in badge list
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_hidden BOOLEAN DEFAULT false, -- Hidden until earned (surprise badges)
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User badges (earned achievements)
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  badge_id UUID REFERENCES badge_definitions(id) ON DELETE CASCADE NOT NULL,
  
  -- Award details
  awarded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  awarded_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL, -- For manual awards
  award_reason TEXT,
  
  -- Display preferences
  is_displayed BOOLEAN DEFAULT true, -- Show on profile
  display_order INTEGER DEFAULT 0,
  
  UNIQUE(user_id, badge_id)
);

-- User points/reputation system
CREATE TABLE IF NOT EXISTS user_points (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Point transaction
  points INTEGER NOT NULL, -- Can be positive or negative
  reason TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('project_created', 'project_liked', 'comment_created', 'discussion_created', 'helpful_answer', 'badge_earned', 'daily_login', 'streak_bonus', 'manual_award', 'penalty')),
  source_id UUID, -- ID of related entity (project, discussion, badge, etc.)
  
  -- Context
  awarded_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL, -- For manual awards
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User streaks (daily activity tracking)
CREATE TABLE IF NOT EXISTS user_streaks (
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE PRIMARY KEY,
  
  -- Current streak
  current_streak INTEGER DEFAULT 0,
  current_streak_start DATE,
  
  -- Best streak
  longest_streak INTEGER DEFAULT 0,
  longest_streak_start DATE,
  longest_streak_end DATE,
  
  -- Last activity
  last_activity_date DATE,
  
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leaderboard snapshots (cached leaderboard data for performance)
CREATE TABLE IF NOT EXISTS leaderboard_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Leaderboard type
  leaderboard_type TEXT NOT NULL CHECK (leaderboard_type IN ('all_time_points', 'monthly_points', 'weekly_points', 'most_projects', 'most_followers', 'most_helpful')),
  
  -- Time period
  period_start DATE NOT NULL,
  period_end DATE,
  
  -- Rankings (stored as JSONB for flexibility)
  rankings JSONB NOT NULL, -- [{ user_id, username, avatar_url, score, rank }]
  
  -- Metadata
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(leaderboard_type, period_start)
);

-- =============================================
-- COMMUNITY COLLECTIONS & SHOWCASES
-- =============================================

-- Curated collections of projects/discussions
CREATE TABLE IF NOT EXISTS community_collections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Collection info
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  
  -- Organization
  collection_type TEXT NOT NULL CHECK (collection_type IN ('projects', 'discussions', 'users', 'mixed')),
  tags TEXT[] DEFAULT '{}',
  
  -- Curation
  curator_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  is_featured BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT true,
  
  -- Engagement
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Items in collections
CREATE TABLE IF NOT EXISTS collection_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id UUID REFERENCES community_collections(id) ON DELETE CASCADE NOT NULL,
  
  -- Item reference (polymorphic)
  item_type TEXT NOT NULL CHECK (item_type IN ('project', 'discussion', 'user')),
  item_id UUID NOT NULL, -- References projects.id, discussions.id, or user_profiles.id
  
  -- Organization
  position INTEGER DEFAULT 0,
  note TEXT, -- Curator's note about why this item is included
  
  -- Metadata
  added_by UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Collection likes
CREATE TABLE IF NOT EXISTS collection_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id UUID REFERENCES community_collections(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(collection_id, user_id)
);

-- =============================================
-- EXTERNAL INTEGRATIONS
-- =============================================

-- Discord integration (for community chat sync)
CREATE TABLE IF NOT EXISTS discord_integrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  
  -- Discord account info
  discord_user_id TEXT NOT NULL UNIQUE,
  discord_username TEXT NOT NULL,
  discord_discriminator TEXT,
  discord_avatar TEXT,
  
  -- OAuth tokens (encrypted)
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Integration settings
  sync_activity BOOLEAN DEFAULT true,
  receive_notifications BOOLEAN DEFAULT true,
  
  -- Metadata
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_sync_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- GitHub OAuth integration (for enhanced profile/project features)
CREATE TABLE IF NOT EXISTS github_integrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  
  -- GitHub account info
  github_user_id INTEGER NOT NULL UNIQUE,
  github_username TEXT NOT NULL UNIQUE,
  github_name TEXT,
  github_avatar_url TEXT,
  github_bio TEXT,
  github_company TEXT,
  github_location TEXT,
  
  -- OAuth tokens (encrypted)
  access_token TEXT NOT NULL,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Stats (synced from GitHub)
  public_repos INTEGER DEFAULT 0,
  public_gists INTEGER DEFAULT 0,
  followers INTEGER DEFAULT 0,
  following INTEGER DEFAULT 0,
  
  -- Integration settings
  import_repos BOOLEAN DEFAULT false,
  sync_profile BOOLEAN DEFAULT true,
  
  -- Metadata
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_sync_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- ENHANCED MODERATION
-- =============================================

-- Discussion reports (extends existing project_reports)
CREATE TABLE IF NOT EXISTS discussion_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  discussion_id UUID REFERENCES discussions(id) ON DELETE CASCADE,
  reply_id UUID REFERENCES discussion_replies(id) ON DELETE CASCADE,
  reporter_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Report details
  reason TEXT NOT NULL,
  category TEXT CHECK (category IN ('spam', 'harassment', 'inappropriate', 'off-topic', 'misinformation', 'other')),
  description TEXT,
  
  -- Status
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'reviewing', 'resolved', 'dismissed')),
  
  -- Review
  reviewed_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  review_notes TEXT,
  action_taken TEXT, -- What action was taken (warning, content removed, user banned, etc.)
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CHECK (discussion_id IS NOT NULL OR reply_id IS NOT NULL) -- Must report either discussion or reply
);

-- User warnings and strikes
CREATE TABLE IF NOT EXISTS user_moderation_actions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  moderator_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL NOT NULL,
  
  -- Action details
  action_type TEXT NOT NULL CHECK (action_type IN ('warning', 'temporary_ban', 'permanent_ban', 'content_removal', 'privileges_revoked')),
  reason TEXT NOT NULL,
  notes TEXT,
  
  -- For temporary bans
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Related content
  related_type TEXT CHECK (related_type IN ('project', 'discussion', 'reply', 'comment')),
  related_id UUID,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_appealed BOOLEAN DEFAULT false,
  appeal_status TEXT CHECK (appeal_status IN ('pending', 'approved', 'denied')),
  appeal_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Discussion channels
CREATE INDEX idx_discussion_channels_slug ON discussion_channels(slug);
CREATE INDEX idx_discussion_channels_position ON discussion_channels(position);

-- Discussions
CREATE INDEX idx_discussions_channel_id ON discussions(channel_id);
CREATE INDEX idx_discussions_author_id ON discussions(author_id);
CREATE INDEX idx_discussions_created_at ON discussions(created_at DESC);
CREATE INDEX idx_discussions_last_activity ON discussions(last_activity_at DESC);
CREATE INDEX idx_discussions_tags ON discussions USING GIN(tags);
CREATE INDEX idx_discussions_pinned ON discussions(is_pinned) WHERE is_pinned = true;

-- Discussion replies
CREATE INDEX idx_discussion_replies_discussion_id ON discussion_replies(discussion_id);
CREATE INDEX idx_discussion_replies_author_id ON discussion_replies(author_id);
CREATE INDEX idx_discussion_replies_parent_id ON discussion_replies(parent_id);
CREATE INDEX idx_discussion_replies_created_at ON discussion_replies(created_at);

-- Badges
CREATE INDEX idx_badge_definitions_category ON badge_definitions(category);
CREATE INDEX idx_badge_definitions_rarity ON badge_definitions(rarity);
CREATE INDEX idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX idx_user_badges_badge_id ON user_badges(badge_id);
CREATE INDEX idx_user_badges_awarded_at ON user_badges(awarded_at DESC);

-- Points
CREATE INDEX idx_user_points_user_id ON user_points(user_id);
CREATE INDEX idx_user_points_created_at ON user_points(created_at DESC);
CREATE INDEX idx_user_points_source_type ON user_points(source_type);

-- Collections
CREATE INDEX idx_community_collections_slug ON community_collections(slug);
CREATE INDEX idx_community_collections_curator_id ON community_collections(curator_id);
CREATE INDEX idx_community_collections_featured ON community_collections(is_featured) WHERE is_featured = true;
CREATE INDEX idx_collection_items_collection_id ON collection_items(collection_id);
CREATE INDEX idx_collection_items_item_type_id ON collection_items(item_type, item_id);

-- Integrations
CREATE INDEX idx_discord_integrations_user_id ON discord_integrations(user_id);
CREATE INDEX idx_discord_integrations_discord_user_id ON discord_integrations(discord_user_id);
CREATE INDEX idx_github_integrations_user_id ON github_integrations(user_id);
CREATE INDEX idx_github_integrations_github_username ON github_integrations(github_username);

-- Moderation
CREATE INDEX idx_discussion_reports_status ON discussion_reports(status);
CREATE INDEX idx_discussion_reports_reporter_id ON discussion_reports(reporter_id);
CREATE INDEX idx_user_moderation_actions_user_id ON user_moderation_actions(user_id);
CREATE INDEX idx_user_moderation_actions_is_active ON user_moderation_actions(is_active) WHERE is_active = true;

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- Enable RLS
ALTER TABLE discussion_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_reply_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE badge_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE discord_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE github_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_moderation_actions ENABLE ROW LEVEL SECURITY;

-- Discussion Channels: Everyone can view
CREATE POLICY "Anyone can view channels" ON discussion_channels
  FOR SELECT USING (true);

-- Only admins can create/update/delete channels
CREATE POLICY "Admins can manage channels" ON discussion_channels
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'moderator')
    )
  );

-- Discussions: Public discussions viewable by all
CREATE POLICY "Anyone can view discussions" ON discussions
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create discussions" ON discussions
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their discussions" ON discussions
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Authors and moderators can delete discussions" ON discussions
  FOR DELETE USING (
    auth.uid() = author_id OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'moderator')
    )
  );

-- Discussion Replies: Similar to discussions
CREATE POLICY "Anyone can view replies" ON discussion_replies
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create replies" ON discussion_replies
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their replies" ON discussion_replies
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Authors and moderators can delete replies" ON discussion_replies
  FOR DELETE USING (
    auth.uid() = author_id OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'moderator')
    )
  );

-- Likes: Users can manage their own likes
CREATE POLICY "Anyone can view discussion likes" ON discussion_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can like discussions" ON discussion_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike discussions" ON discussion_likes
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view reply likes" ON discussion_reply_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can like replies" ON discussion_reply_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike replies" ON discussion_reply_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Views: Anyone can record views
CREATE POLICY "Anyone can view discussion views" ON discussion_views
  FOR SELECT USING (true);

CREATE POLICY "Anyone can record views" ON discussion_views
  FOR INSERT WITH CHECK (true);

-- Subscriptions: Users manage their own subscriptions
CREATE POLICY "Users can view their subscriptions" ON discussion_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can subscribe" ON discussion_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsubscribe" ON discussion_subscriptions
  FOR DELETE USING (auth.uid() = user_id);

-- Badge Definitions: Everyone can view, admins can manage
CREATE POLICY "Anyone can view badge definitions" ON badge_definitions
  FOR SELECT USING (is_active = true OR is_hidden = false);

CREATE POLICY "Admins can manage badge definitions" ON badge_definitions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- User Badges: Public badges viewable, users see their own
CREATE POLICY "Anyone can view displayed badges" ON user_badges
  FOR SELECT USING (is_displayed = true);

CREATE POLICY "Users can view their own badges" ON user_badges
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can award badges" ON user_badges
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'moderator')
    )
  );

-- User Points: Users can view their own points, leaderboard logic handles aggregation
CREATE POLICY "Users can view their own points" ON user_points
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can award points" ON user_points
  FOR INSERT WITH CHECK (true);

-- Streaks: Users can view their own streaks
CREATE POLICY "Users can view their own streaks" ON user_streaks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can update streaks" ON user_streaks
  FOR ALL WITH CHECK (true);

-- Leaderboards: Everyone can view
CREATE POLICY "Anyone can view leaderboards" ON leaderboard_snapshots
  FOR SELECT USING (true);

CREATE POLICY "System can generate leaderboards" ON leaderboard_snapshots
  FOR ALL WITH CHECK (true);

-- Collections: Public collections viewable by all
CREATE POLICY "Anyone can view public collections" ON community_collections
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view their own collections" ON community_collections
  FOR SELECT USING (auth.uid() = curator_id);

CREATE POLICY "Authenticated users can create collections" ON community_collections
  FOR INSERT WITH CHECK (auth.uid() = curator_id);

CREATE POLICY "Curators can update their collections" ON community_collections
  FOR UPDATE USING (auth.uid() = curator_id);

CREATE POLICY "Curators can delete their collections" ON community_collections
  FOR DELETE USING (auth.uid() = curator_id);

CREATE POLICY "Anyone can view collection items" ON collection_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM community_collections
      WHERE community_collections.id = collection_items.collection_id
      AND community_collections.is_public = true
    )
  );

CREATE POLICY "Collection curators can manage items" ON collection_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM community_collections
      WHERE community_collections.id = collection_items.collection_id
      AND community_collections.curator_id = auth.uid()
    )
  );

-- Collection Likes
CREATE POLICY "Anyone can view collection likes" ON collection_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can like collections" ON collection_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike collections" ON collection_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Integrations: Users can only view/manage their own
CREATE POLICY "Users can view their own Discord integration" ON discord_integrations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their Discord integration" ON discord_integrations
  FOR ALL WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own GitHub integration" ON github_integrations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their GitHub integration" ON github_integrations
  FOR ALL WITH CHECK (auth.uid() = user_id);

-- Discussion Reports: Users can view their own reports, moderators see all
CREATE POLICY "Users can view their own reports" ON discussion_reports
  FOR SELECT USING (auth.uid() = reporter_id);

CREATE POLICY "Moderators can view all reports" ON discussion_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Authenticated users can submit reports" ON discussion_reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Moderators can update reports" ON discussion_reports
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'moderator')
    )
  );

-- Moderation Actions: Only moderators can view/create
CREATE POLICY "Moderators can view all moderation actions" ON user_moderation_actions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Moderators can create moderation actions" ON user_moderation_actions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Moderators can update moderation actions" ON user_moderation_actions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'moderator')
    )
  );

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to update discussion last_activity_at when new reply is added
CREATE OR REPLACE FUNCTION update_discussion_last_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE discussions 
  SET last_activity_at = NOW()
  WHERE id = NEW.discussion_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_discussion_last_activity
  AFTER INSERT ON discussion_replies
  FOR EACH ROW
  EXECUTE FUNCTION update_discussion_last_activity();

-- Function to increment discussion reply count
CREATE OR REPLACE FUNCTION increment_discussion_replies()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE discussions 
  SET replies_count = replies_count + 1
  WHERE id = NEW.discussion_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_discussion_replies
  AFTER INSERT ON discussion_replies
  FOR EACH ROW
  EXECUTE FUNCTION increment_discussion_replies();

-- Function to decrement discussion reply count
CREATE OR REPLACE FUNCTION decrement_discussion_replies()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE discussions 
  SET replies_count = GREATEST(replies_count - 1, 0)
  WHERE id = OLD.discussion_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_decrement_discussion_replies
  AFTER DELETE ON discussion_replies
  FOR EACH ROW
  EXECUTE FUNCTION decrement_discussion_replies();

-- Function to update user total points (aggregate from user_points)
CREATE OR REPLACE FUNCTION calculate_user_total_points(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  total INTEGER;
BEGIN
  SELECT COALESCE(SUM(points), 0) INTO total
  FROM user_points
  WHERE user_id = p_user_id;
  
  RETURN total;
END;
$$ LANGUAGE plpgsql;

-- Function to award badge to user
CREATE OR REPLACE FUNCTION award_badge(
  p_user_id UUID,
  p_badge_slug TEXT,
  p_awarded_by UUID DEFAULT NULL,
  p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_badge_id UUID;
  v_points INTEGER;
BEGIN
  -- Get badge details
  SELECT id, points_value INTO v_badge_id, v_points
  FROM badge_definitions
  WHERE slug = p_badge_slug AND is_active = true;
  
  IF v_badge_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if user already has this badge
  IF EXISTS (SELECT 1 FROM user_badges WHERE user_id = p_user_id AND badge_id = v_badge_id) THEN
    RETURN FALSE;
  END IF;
  
  -- Award badge
  INSERT INTO user_badges (user_id, badge_id, awarded_by, award_reason)
  VALUES (p_user_id, v_badge_id, p_awarded_by, p_reason);
  
  -- Award points
  IF v_points > 0 THEN
    INSERT INTO user_points (user_id, points, reason, source_type, source_id)
    VALUES (p_user_id, v_points, 'Badge earned: ' || p_badge_slug, 'badge_earned', v_badge_id);
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to update user streak
CREATE OR REPLACE FUNCTION update_user_streak(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_last_activity DATE;
  v_current_streak INTEGER;
  v_streak_start DATE;
  v_longest_streak INTEGER;
BEGIN
  -- Get current streak data
  SELECT last_activity_date, current_streak, current_streak_start, longest_streak
  INTO v_last_activity, v_current_streak, v_streak_start, v_longest_streak
  FROM user_streaks
  WHERE user_id = p_user_id;
  
  -- If no record exists, create one
  IF NOT FOUND THEN
    INSERT INTO user_streaks (user_id, current_streak, current_streak_start, longest_streak, last_activity_date)
    VALUES (p_user_id, 1, CURRENT_DATE, 1, CURRENT_DATE);
    RETURN;
  END IF;
  
  -- If activity is today, do nothing
  IF v_last_activity = CURRENT_DATE THEN
    RETURN;
  END IF;
  
  -- If activity was yesterday, increment streak
  IF v_last_activity = CURRENT_DATE - INTERVAL '1 day' THEN
    v_current_streak := v_current_streak + 1;
    
    -- Update longest streak if current is higher
    IF v_current_streak > v_longest_streak THEN
      UPDATE user_streaks
      SET current_streak = v_current_streak,
          longest_streak = v_current_streak,
          longest_streak_start = v_streak_start,
          longest_streak_end = CURRENT_DATE,
          last_activity_date = CURRENT_DATE,
          updated_at = NOW()
      WHERE user_id = p_user_id;
    ELSE
      UPDATE user_streaks
      SET current_streak = v_current_streak,
          last_activity_date = CURRENT_DATE,
          updated_at = NOW()
      WHERE user_id = p_user_id;
    END IF;
  ELSE
    -- Streak broken, start new streak
    UPDATE user_streaks
    SET current_streak = 1,
        current_streak_start = CURRENT_DATE,
        last_activity_date = CURRENT_DATE,
        updated_at = NOW()
    WHERE user_id = p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- SEED DATA
-- =============================================

-- Insert default discussion channels
INSERT INTO discussion_channels (name, slug, description, icon, color, position, is_default) VALUES
  ('General', 'general', 'General discussions about coding and development', '💬', '#3B82F6', 1, true),
  ('Help & Support', 'help', 'Get help with your code or the platform', '🆘', '#10B981', 2, false),
  ('Showcase', 'showcase', 'Show off your projects and get feedback', '✨', '#8B5CF6', 3, false),
  ('Ideas & Feedback', 'ideas', 'Suggest features and improvements', '💡', '#F59E0B', 4, false),
  ('Off Topic', 'off-topic', 'Casual conversations about anything', '🎮', '#6B7280', 5, false)
ON CONFLICT (slug) DO NOTHING;

-- Insert badge definitions
INSERT INTO badge_definitions (name, slug, description, icon, color, category, criteria_type, criteria_value, rarity, points_value, position) VALUES
  -- Contribution badges
  ('First Project', 'first-project', 'Created your first project', '🎯', '#10B981', 'contribution', 'projects_count', 1, 'common', 10, 1),
  ('Prolific Creator', 'prolific-creator', 'Created 10 projects', '🏆', '#F59E0B', 'contribution', 'projects_count', 10, 'rare', 50, 2),
  ('Master Builder', 'master-builder', 'Created 50 projects', '👑', '#8B5CF6', 'contribution', 'projects_count', 50, 'epic', 200, 3),
  ('Code Legend', 'code-legend', 'Created 100 projects', '⭐', '#EF4444', 'contribution', 'projects_count', 100, 'legendary', 500, 4),
  
  -- Social badges
  ('First Like', 'first-like', 'Received your first like', '❤️', '#EC4899', 'social', 'likes_received', 1, 'common', 5, 5),
  ('Popular', 'popular', 'Received 100 likes', '🔥', '#F59E0B', 'social', 'likes_received', 100, 'rare', 50, 6),
  ('Influencer', 'influencer', 'Received 500 likes', '🌟', '#8B5CF6', 'social', 'likes_received', 500, 'epic', 200, 7),
  ('Celebrity', 'celebrity', 'Received 1000 likes', '💫', '#EF4444', 'social', 'likes_received', 1000, 'legendary', 500, 8),
  
  ('Good Follower', 'good-follower', '10 followers', '👥', '#10B981', 'social', 'followers_count', 10, 'common', 20, 9),
  ('Community Leader', 'community-leader', '100 followers', '🎖️', '#8B5CF6', 'social', 'followers_count', 100, 'epic', 100, 10),
  
  -- Skill badges
  ('Helpful', 'helpful', 'Received 10 helpful answer votes', '🤝', '#10B981', 'skill', 'helpful_answers', 10, 'rare', 30, 11),
  ('Mentor', 'mentor', 'Received 50 helpful answer votes', '🎓', '#8B5CF6', 'skill', 'helpful_answers', 50, 'epic', 150, 12),
  
  -- Milestone badges
  ('Week Streak', 'week-streak', 'Active for 7 consecutive days', '🔥', '#F59E0B', 'milestone', 'streak_days', 7, 'common', 25, 13),
  ('Month Streak', 'month-streak', 'Active for 30 consecutive days', '💪', '#8B5CF6', 'milestone', 'streak_days', 30, 'rare', 100, 14),
  ('Year Streak', 'year-streak', 'Active for 365 consecutive days', '🏅', '#EF4444', 'milestone', 'streak_days', 365, 'legendary', 1000, 15),
  
  -- Special badges
  ('Early Adopter', 'early-adopter', 'Joined in the first month', '🚀', '#3B82F6', 'special', 'manual', NULL, 'epic', 100, 16),
  ('Beta Tester', 'beta-tester', 'Helped test new features', '🧪', '#8B5CF6', 'special', 'manual', NULL, 'rare', 50, 17),
  ('Community Champion', 'community-champion', 'Outstanding community contributions', '👑', '#F59E0B', 'special', 'manual', NULL, 'legendary', 500, 18)
ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- COMPLETION CONFIRMATION
-- =============================================

DO $$
BEGIN
  RAISE NOTICE '✓ Community features schema created successfully!';
  RAISE NOTICE '✓ Discussion system tables: 7 tables';
  RAISE NOTICE '✓ Gamification tables: 5 tables';
  RAISE NOTICE '✓ Community collections: 3 tables';
  RAISE NOTICE '✓ External integrations: 2 tables';
  RAISE NOTICE '✓ Enhanced moderation: 2 tables';
  RAISE NOTICE '✓ Total new tables: 19';
  RAISE NOTICE '✓ RLS policies: Enabled and configured';
  RAISE NOTICE '✓ Functions: 5 utility functions';
  RAISE NOTICE '✓ Triggers: 3 automatic triggers';
  RAISE NOTICE '✓ Seed data: 5 channels + 18 badges';
END $$;
