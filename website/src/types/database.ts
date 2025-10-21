export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          username: string
          full_name: string | null
          bio: string | null
          avatar_url: string | null
          github_username: string | null
          twitter_handle: string | null
          website_url: string | null
          linkedin_url: string | null
          preferred_languages: string[]
          coding_experience: 'beginner' | 'intermediate' | 'advanced' | 'expert'
          profile_visibility: 'public' | 'private' | 'friends'
          email_notifications: boolean
          marketing_emails: boolean
          onboarding_completed: boolean
          location: string | null
          timezone: string | null
          company: string | null
          job_title: string | null
          skills: string[]
          interests: string[]
          last_seen_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          full_name?: string | null
          bio?: string | null
          avatar_url?: string | null
          github_username?: string | null
          twitter_handle?: string | null
          website_url?: string | null
          linkedin_url?: string | null
          preferred_languages?: string[]
          coding_experience?: 'beginner' | 'intermediate' | 'advanced' | 'expert'
          profile_visibility?: 'public' | 'private' | 'friends'
          email_notifications?: boolean
          marketing_emails?: boolean
          onboarding_completed?: boolean
          location?: string | null
          timezone?: string | null
          company?: string | null
          job_title?: string | null
          skills?: string[]
          interests?: string[]
          last_seen_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          full_name?: string | null
          bio?: string | null
          avatar_url?: string | null
          github_username?: string | null
          twitter_handle?: string | null
          website_url?: string | null
          linkedin_url?: string | null
          preferred_languages?: string[]
          coding_experience?: 'beginner' | 'intermediate' | 'advanced' | 'expert'
          profile_visibility?: 'public' | 'private' | 'friends'
          email_notifications?: boolean
          marketing_emails?: boolean
          onboarding_completed?: boolean
          location?: string | null
          timezone?: string | null
          company?: string | null
          job_title?: string | null
          skills?: string[]
          interests?: string[]
          last_seen_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          content: Json
          language: string
          framework: string | null
          tags: string[]
          is_public: boolean
          is_featured: boolean
          likes_count: number
          views_count: number
          forks_count: number
          comments_count: number
          difficulty_level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
          estimated_time: number | null
          thumbnail_url: string | null
          demo_url: string | null
          github_url: string | null
          forked_from: string | null
          status: 'draft' | 'published' | 'archived'
          featured_at: string | null
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          content: Json
          language: string
          framework?: string | null
          tags?: string[]
          is_public?: boolean
          is_featured?: boolean
          likes_count?: number
          views_count?: number
          forks_count?: number
          comments_count?: number
          difficulty_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert'
          estimated_time?: number | null
          thumbnail_url?: string | null
          demo_url?: string | null
          github_url?: string | null
          forked_from?: string | null
          status?: 'draft' | 'published' | 'archived'
          featured_at?: string | null
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          content?: Json
          language?: string
          framework?: string | null
          tags?: string[]
          is_public?: boolean
          is_featured?: boolean
          likes_count?: number
          views_count?: number
          forks_count?: number
          comments_count?: number
          difficulty_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert'
          estimated_time?: number | null
          thumbnail_url?: string | null
          demo_url?: string | null
          github_url?: string | null
          forked_from?: string | null
          status?: 'draft' | 'published' | 'archived'
          featured_at?: string | null
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      project_likes: {
        Row: {
          id: string
          project_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          created_at?: string
        }
      }
      project_views: {
        Row: {
          id: string
          project_id: string
          user_id: string | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          project_id: string
          user_id: string
          content: string
          parent_id: string | null
          likes_count: number
          is_edited: boolean
          is_deleted: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          content: string
          parent_id?: string | null
          likes_count?: number
          is_edited?: boolean
          is_deleted?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          content?: string
          parent_id?: string | null
          likes_count?: number
          is_edited?: boolean
          is_deleted?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      user_follows: {
        Row: {
          id: string
          follower_id: string
          following_id: string
          created_at: string
        }
        Insert: {
          id?: string
          follower_id: string
          following_id: string
          created_at?: string
        }
        Update: {
          id?: string
          follower_id?: string
          following_id?: string
          created_at?: string
        }
      }
      user_activity: {
        Row: {
          id: string
          user_id: string
          activity_type: 'project_created' | 'project_liked' | 'project_commented' | 'user_followed' | 'profile_updated'
          activity_data: Json
          related_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          activity_type: 'project_created' | 'project_liked' | 'project_commented' | 'user_followed' | 'profile_updated'
          activity_data?: Json
          related_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          activity_type?: 'project_created' | 'project_liked' | 'project_commented' | 'user_followed' | 'profile_updated'
          activity_data?: Json
          related_id?: string | null
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: 'like' | 'comment' | 'follow' | 'project_featured' | 'system'
          title: string
          message: string
          data: Json | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'like' | 'comment' | 'follow' | 'project_featured' | 'system'
          title: string
          message: string
          data?: Json | null
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'like' | 'comment' | 'follow' | 'project_featured' | 'system'
          title?: string
          message?: string
          data?: Json | null
          is_read?: boolean
          created_at?: string
        }
      }
      project_collaborators: {
        Row: {
          id: string
          project_id: string
          user_id: string
          invited_by: string
          role: 'viewer' | 'editor' | 'admin'
          status: 'pending' | 'accepted' | 'declined'
          invited_at: string
          accepted_at: string | null
          last_active_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          invited_by: string
          role: 'viewer' | 'editor' | 'admin'
          status?: 'pending' | 'accepted' | 'declined'
          invited_at?: string
          accepted_at?: string | null
          last_active_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          invited_by?: string
          role?: 'viewer' | 'editor' | 'admin'
          status?: 'pending' | 'accepted' | 'declined'
          invited_at?: string
          accepted_at?: string | null
          last_active_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      collaboration_invites: {
        Row: {
          id: string
          project_id: string
          invited_by: string
          email: string
          role: 'viewer' | 'editor' | 'admin'
          token: string
          expires_at: string
          status: 'pending' | 'accepted' | 'declined' | 'expired'
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          invited_by: string
          email: string
          role: 'viewer' | 'editor' | 'admin'
          token: string
          expires_at: string
          status?: 'pending' | 'accepted' | 'declined' | 'expired'
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          invited_by?: string
          email?: string
          role?: 'viewer' | 'editor' | 'admin'
          token?: string
          expires_at?: string
          status?: 'pending' | 'accepted' | 'declined' | 'expired'
          created_at?: string
        }
      }
      collaboration_activity: {
        Row: {
          id: string
          project_id: string
          user_id: string
          activity_type: 'join' | 'leave' | 'edit' | 'comment' | 'invite' | 'role_change'
          activity_data: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          activity_type: 'join' | 'leave' | 'edit' | 'comment' | 'invite' | 'role_change'
          activity_data?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          activity_type?: 'join' | 'leave' | 'edit' | 'comment' | 'invite' | 'role_change'
          activity_data?: Json | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
