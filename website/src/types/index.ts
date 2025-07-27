import { Database } from './database'

// Type helpers for easier usage
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Main entity types
export type UserProfile = Tables<'user_profiles'>
export type Project = Tables<'projects'>
export type ProjectLike = Tables<'project_likes'>
export type ProjectView = Tables<'project_views'>
export type Comment = Tables<'comments'>
export type UserFollow = Tables<'user_follows'>
export type UserActivity = Tables<'user_activity'>
export type Notification = Tables<'notifications'>

// Insert types
export type InsertUserProfile = InsertTables<'user_profiles'>
export type InsertProject = InsertTables<'projects'>
export type InsertProjectLike = InsertTables<'project_likes'>
export type InsertProjectView = InsertTables<'project_views'>
export type InsertComment = InsertTables<'comments'>
export type InsertUserFollow = InsertTables<'user_follows'>
export type InsertUserActivity = InsertTables<'user_activity'>
export type InsertNotification = InsertTables<'notifications'>

// Update types
export type UpdateUserProfile = UpdateTables<'user_profiles'>
export type UpdateProject = UpdateTables<'projects'>
export type UpdateComment = UpdateTables<'comments'>

// Enhanced types with relationships
export type ProjectWithAuthor = Project & {
  user_profiles: Pick<UserProfile, 'id' | 'username' | 'full_name' | 'avatar_url'>
}

export type ProjectWithDetails = Project & {
  user_profiles: Pick<UserProfile, 'id' | 'username' | 'full_name' | 'avatar_url'>
  is_liked?: boolean
  total_likes: number
  total_comments: number
  total_views: number
}

export type CommentWithAuthor = Comment & {
  user_profiles: Pick<UserProfile, 'id' | 'username' | 'full_name' | 'avatar_url'>
  replies?: CommentWithAuthor[]
}

export type UserWithStats = UserProfile & {
  followers_count: number
  following_count: number
  projects_count: number
  total_likes: number
  total_views: number
  is_following?: boolean
}

export type ActivityWithDetails = UserActivity & {
  user_profiles: Pick<UserProfile, 'id' | 'username' | 'full_name' | 'avatar_url'>
  projects?: Pick<Project, 'id' | 'title'>
}

// Form types
export type ProfileFormData = {
  username: string
  full_name: string
  bio: string
  github_username: string
  twitter_handle: string
  website_url: string
  linkedin_url: string
  preferred_languages: string[]
  coding_experience: UserProfile['coding_experience']
  location: string
  timezone: string
  company: string
  job_title: string
  skills: string[]
  interests: string[]
  profile_visibility: UserProfile['profile_visibility']
  email_notifications: boolean
  marketing_emails: boolean
}

export type ProjectFormData = {
  title: string
  description: string
  content: Record<string, unknown> // JSON content from the editor
  language: string
  framework: string
  tags: string[]
  is_public: boolean
  difficulty_level: Project['difficulty_level']
  estimated_time: number
  demo_url: string
  github_url: string
}

// Search and filter types
export type ProjectFilter = {
  language?: string
  framework?: string
  difficulty?: Project['difficulty_level']
  tags?: string[]
  is_featured?: boolean
  author?: string
  search?: string
}

export type UserFilter = {
  coding_experience?: UserProfile['coding_experience']
  skills?: string[]
  location?: string
  search?: string
}

// Pagination
export type PaginationParams = {
  page: number
  limit: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

export type PaginatedResponse<T> = {
  data: T[]
  total: number
  page: number
  limit: number
  total_pages: number
  has_next: boolean
  has_prev: boolean
}

// API Response types
export type ApiResponse<T = Record<string, unknown>> = {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Statistics types
export type UserStats = {
  projects_count: number
  followers_count: number
  following_count: number
  total_likes_received: number
  total_views_received: number
  total_comments_received: number
  joined_date: string
  last_active: string
}

export type ProjectStats = {
  likes_count: number
  views_count: number
  comments_count: number
  forks_count: number
  created_at: string
  updated_at: string
}

export type PlatformStats = {
  total_users: number
  total_projects: number
  total_likes: number
  total_comments: number
  active_users_today: number
  projects_created_today: number
}

// Real-time types
export type RealtimePayload<T = Record<string, unknown>> = {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: T
  old: T
  schema: string
  table: string
  commit_timestamp: string
}

// Error types
export type DatabaseError = {
  code: string
  message: string
  details: string
  hint: string
}

export type ValidationError = {
  field: string
  message: string
}

// Auth types (extending Supabase auth)
export type AuthUser = {
  id: string
  email: string
  user_metadata: {
    full_name?: string
    avatar_url?: string
    provider?: string
  }
  app_metadata: {
    provider?: string
    providers?: string[]
  }
}

export type SessionWithProfile = {
  user: AuthUser
  profile: UserProfile | null
}
