// =============================================
// COMMUNITY FEATURE TYPES
// TypeScript types for discussions, badges, collections, etc.
// =============================================

// Discussion System Types
export type DiscussionChannel = {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  color: string | null
  position: number
  is_default: boolean
  is_archived: boolean
  requires_role: 'user' | 'admin' | 'moderator'
  created_by: string | null
  created_at: string
  updated_at: string
}

export type Discussion = {
  id: string
  channel_id: string
  author_id: string
  title: string
  content: string
  tags: string[]
  is_pinned: boolean
  is_locked: boolean
  is_archived: boolean
  views_count: number
  replies_count: number
  likes_count: number
  has_accepted_answer: boolean
  accepted_answer_id: string | null
  last_activity_at: string
  created_at: string
  updated_at: string
}

export type DiscussionReply = {
  id: string
  discussion_id: string
  author_id: string
  parent_id: string | null
  content: string
  is_accepted_answer: boolean
  is_edited: boolean
  is_deleted: boolean
  likes_count: number
  created_at: string
  updated_at: string
}

export type DiscussionLike = {
  id: string
  discussion_id: string
  user_id: string
  created_at: string
}

export type DiscussionView = {
  id: string
  discussion_id: string
  user_id: string | null
  ip_address: string | null
  created_at: string
}

export type DiscussionSubscription = {
  id: string
  discussion_id: string
  user_id: string
  notify_on_reply: boolean
  created_at: string
}

// Gamification Types
export type BadgeDefinition = {
  id: string
  name: string
  slug: string
  description: string
  icon: string | null
  color: string | null
  category: 'contribution' | 'social' | 'skill' | 'milestone' | 'special'
  criteria_type: 'manual' | 'projects_count' | 'likes_received' | 'comments_count' | 'followers_count' | 'streak_days' | 'discussion_count' | 'helpful_answers'
  criteria_value: number | null
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  points_value: number
  position: number
  is_active: boolean
  is_hidden: boolean
  created_at: string
}

export type UserBadge = {
  id: string
  user_id: string
  badge_id: string
  awarded_at: string
  awarded_by: string | null
  award_reason: string | null
  is_displayed: boolean
  display_order: number
}

export type UserPoints = {
  id: string
  user_id: string
  points: number
  reason: string
  source_type: 'project_created' | 'project_liked' | 'comment_created' | 'discussion_created' | 'helpful_answer' | 'badge_earned' | 'daily_login' | 'streak_bonus' | 'manual_award' | 'penalty'
  source_id: string | null
  awarded_by: string | null
  created_at: string
}

export type UserStreak = {
  user_id: string
  current_streak: number
  current_streak_start: string | null
  longest_streak: number
  longest_streak_start: string | null
  longest_streak_end: string | null
  last_activity_date: string | null
  updated_at: string
}

export type LeaderboardSnapshot = {
  id: string
  leaderboard_type: 'all_time_points' | 'monthly_points' | 'weekly_points' | 'most_projects' | 'most_followers' | 'most_helpful'
  period_start: string
  period_end: string | null
  rankings: unknown // JSONB
  generated_at: string
}

// Collection Types
export type CommunityCollection = {
  id: string
  title: string
  slug: string
  description: string | null
  cover_image_url: string | null
  collection_type: 'projects' | 'discussions' | 'users' | 'mixed'
  tags: string[]
  curator_id: string
  is_featured: boolean
  is_public: boolean
  views_count: number
  likes_count: number
  created_at: string
  updated_at: string
}

export type CollectionItem = {
  id: string
  collection_id: string
  item_type: 'project' | 'discussion' | 'user'
  item_id: string
  position: number
  note: string | null
  added_by: string
  added_at: string
}

export type CollectionLike = {
  id: string
  collection_id: string
  user_id: string
  created_at: string
}

// Integration Types
export type DiscordIntegration = {
  id: string
  user_id: string
  discord_user_id: string
  discord_username: string
  discord_discriminator: string | null
  discord_avatar: string | null
  access_token: string
  refresh_token: string | null
  token_expires_at: string | null
  sync_activity: boolean
  receive_notifications: boolean
  connected_at: string
  last_sync_at: string | null
  updated_at: string
}

export type GitHubIntegration = {
  id: string
  user_id: string
  github_user_id: number
  github_username: string
  github_name: string | null
  github_avatar_url: string | null
  github_bio: string | null
  github_company: string | null
  github_location: string | null
  access_token: string
  token_expires_at: string | null
  public_repos: number
  public_gists: number
  followers: number
  following: number
  import_repos: boolean
  sync_profile: boolean
  connected_at: string
  last_sync_at: string | null
  updated_at: string
}

// Moderation Types
export type DiscussionReport = {
  id: string
  discussion_id: string | null
  reply_id: string | null
  reporter_id: string
  reason: string
  category: 'spam' | 'harassment' | 'inappropriate' | 'off-topic' | 'misinformation' | 'other' | null
  description: string | null
  status: 'open' | 'reviewing' | 'resolved' | 'dismissed'
  reviewed_by: string | null
  review_notes: string | null
  action_taken: string | null
  created_at: string
  reviewed_at: string | null
  updated_at: string
}

export type UserModerationAction = {
  id: string
  user_id: string
  moderator_id: string
  action_type: 'warning' | 'temporary_ban' | 'permanent_ban' | 'content_removal' | 'privileges_revoked'
  reason: string
  notes: string | null
  expires_at: string | null
  related_type: 'project' | 'discussion' | 'reply' | 'comment' | null
  related_id: string | null
  is_active: boolean
  is_appealed: boolean
  appeal_status: 'pending' | 'approved' | 'denied' | null
  appeal_notes: string | null
  created_at: string
  updated_at: string
}

// Enhanced types with relationships
export type DiscussionWithDetails = Discussion & {
  channel: Pick<DiscussionChannel, 'id' | 'name' | 'slug' | 'icon' | 'color'>
  author: {
    id: string
    username: string
    full_name: string | null
    avatar_url: string | null
    role: string
  }
  is_liked?: boolean
  is_subscribed?: boolean
}

export type DiscussionReplyWithAuthor = DiscussionReply & {
  author: {
    id: string
    username: string
    full_name: string | null
    avatar_url: string | null
    role: string
  }
  replies?: DiscussionReplyWithAuthor[]
  is_liked?: boolean
}

export type BadgeWithProgress = BadgeDefinition & {
  is_earned?: boolean
  earned_at?: string
  progress?: number // 0-100 percentage towards earning
  progress_current?: number // Current value (e.g., 5 projects)
  progress_required?: number // Required value (e.g., 10 projects)
}

export type UserWithBadges = {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
  role: string
  total_points: number
  badges: Array<{
    badge_id: string
    badge_name: string
    badge_icon: string
    badge_rarity: string
    awarded_at: string
  }>
  current_streak: number
  longest_streak: number
}

export type LeaderboardEntry = {
  rank: number
  user_id: string
  username: string
  avatar_url: string | null
  score: number
  change?: number // Position change since last period
}

export type CollectionWithItems = CommunityCollection & {
  curator: {
    id: string
    username: string
    full_name: string | null
    avatar_url: string | null
  }
  item_count: number
  items?: Array<CollectionItem & {
    project?: {
      id: string
      title: string
      thumbnail_url: string | null
    }
    discussion?: {
      id: string
      title: string
    }
    user?: {
      id: string
      username: string
      avatar_url: string | null
    }
  }>
}

// Form types
export type CreateDiscussionInput = {
  channel_id: string
  title: string
  content: string
  tags?: string[]
}

export type CreateReplyInput = {
  discussion_id: string
  content: string
  parent_id?: string
}

export type CreateCollectionInput = {
  title: string
  slug: string
  description?: string
  cover_image_url?: string
  collection_type: 'projects' | 'discussions' | 'users' | 'mixed'
  tags?: string[]
  is_public: boolean
}

export type AddCollectionItemInput = {
  collection_id: string
  item_type: 'project' | 'discussion' | 'user'
  item_id: string
  position?: number
  note?: string
}

export type ReportDiscussionInput = {
  discussion_id?: string
  reply_id?: string
  reason: string
  category: 'spam' | 'harassment' | 'inappropriate' | 'off-topic' | 'misinformation' | 'other'
  description?: string
}

export type CreateModerationActionInput = {
  user_id: string
  action_type: 'warning' | 'temporary_ban' | 'permanent_ban' | 'content_removal' | 'privileges_revoked'
  reason: string
  notes?: string
  expires_at?: string
  related_type?: 'project' | 'discussion' | 'reply' | 'comment'
  related_id?: string
}

// Filter types
export type DiscussionFilter = {
  channel_id?: string
  author_id?: string
  tags?: string[]
  has_accepted_answer?: boolean
  is_pinned?: boolean
  search?: string
}

export type LeaderboardType = 
  | 'all_time_points'
  | 'monthly_points'
  | 'weekly_points'
  | 'most_projects'
  | 'most_followers'
  | 'most_helpful'

export type BadgeCategory = 'contribution' | 'social' | 'skill' | 'milestone' | 'special'
export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary'

export type ModeratorActionType = 
  | 'warning'
  | 'temporary_ban'
  | 'permanent_ban'
  | 'content_removal'
  | 'privileges_revoked'

// Statistics
export type CommunityStats = {
  total_discussions: number
  total_replies: number
  active_users_today: number
  total_badges_earned: number
  total_points_awarded: number
}

export type UserCommunityStats = {
  total_discussions: number
  total_replies: number
  helpful_answers: number
  total_points: number
  badges_earned: number
  current_streak: number
  longest_streak: number
  leaderboard_rank?: number
}

// API Response types
export type DiscussionListResponse = {
  discussions: DiscussionWithDetails[]
  total: number
  page: number
  limit: number
  has_next: boolean
}

export type LeaderboardResponse = {
  leaderboard_type: LeaderboardType
  period_start: string
  period_end?: string
  entries: LeaderboardEntry[]
  user_rank?: number
  generated_at: string
}

export type BadgeProgressResponse = {
  badges: BadgeWithProgress[]
  total_points: number
  next_badge?: BadgeDefinition
}
