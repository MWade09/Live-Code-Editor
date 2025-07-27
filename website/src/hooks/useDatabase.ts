'use client'

import { useState, useEffect, useCallback } from 'react'
import { db } from '@/lib/database'
import type {
  UserProfile,
  Project,
  ProjectWithDetails,
  UserStats,
  PaginatedResponse,
  PaginationParams,
  ProjectFilter,
  ProfileFormData,
  ActivityWithDetails,
  ApiResponse
} from '@/types'

// Simplified project form data for the hooks
export interface SimpleProjectFormData {
  title: string
  description: string
  content: string // Simplified as string
  language: string
  framework: string
  tags: string[]
  is_public: boolean
  difficulty_level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  estimated_time: number
  demo_url: string
  github_url: string
}

// Hook for user profile management
export function useUserProfile(userId?: string) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasAttempted, setHasAttempted] = useState(false)

  const fetchProfile = useCallback(async () => {
    if (!userId || hasAttempted) return

    setLoading(true)
    setError(null)
    setHasAttempted(true)

    try {
      const result = await db.getUserProfile(userId)
      if (result.success && result.data) {
        setProfile(result.data)
      } else if (result.error?.includes('No profile found')) {
        // Profile doesn't exist, create a basic one
        const createResult = await db.createUserProfile({
          id: userId,
          username: `user_${Date.now()}`,
          full_name: null,
          bio: null,
          avatar_url: null,
          github_username: null,
          twitter_handle: null,
          website_url: null,
          linkedin_url: null,
          preferred_languages: [],
          coding_experience: 'beginner',
          location: null,
          timezone: null,
          company: null,
          job_title: null,
          skills: [],
          interests: [],
          profile_visibility: 'public',
          email_notifications: true,
          marketing_emails: false,
          last_seen_at: new Date().toISOString(),
          onboarding_completed: false
        })
        
        if (createResult.success && createResult.data) {
          setProfile(createResult.data)
        } else {
          setError(createResult.error || 'Failed to create profile')
        }
      } else {
        setError(result.error || 'Failed to fetch profile')
      }
    } catch (err) {
      setError('Network error occurred')
      console.error('Profile fetch error:', err)
    }
    
    setLoading(false)
  }, [userId, hasAttempted])

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    fetchProfile()
  }, [fetchProfile, userId])

  const updateProfile = async (updates: Partial<ProfileFormData>): Promise<boolean> => {
    if (!userId) return false

    setError(null)
    const result = await db.updateUserProfile(userId, updates)
    
    if (result.success && result.data) {
      setProfile(result.data)
      return true
    } else {
      setError(result.error || 'Failed to update profile')
      return false
    }
  }

  const checkUsername = async (username: string): Promise<boolean> => {
    const result = await db.checkUsernameAvailability(username, userId)
    return result.success ? (result.data || false) : false
  }

  return {
    profile,
    loading,
    error,
    updateProfile,
    checkUsername,
    refetch: fetchProfile
  }
}

// Hook for user statistics
export function useUserStats(userId?: string) {
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasAttempted, setHasAttempted] = useState(false)

  const fetchStats = useCallback(async () => {
    if (!userId || hasAttempted) return

    setLoading(true)
    setError(null)
    setHasAttempted(true)

    try {
      const result = await db.getUserStats(userId)
      if (result.success && result.data) {
        setStats(result.data)
      } else {
        setError(result.error || 'Failed to fetch stats')
        // Set default stats if fetch fails
        setStats({
          projects_count: 0,
          followers_count: 0,
          following_count: 0,
          total_likes_received: 0,
          total_views_received: 0,
          total_comments_received: 0,
          joined_date: new Date().toISOString(),
          last_active: new Date().toISOString()
        })
      }
    } catch (err) {
      setError('Network error occurred')
      console.error('Stats fetch error:', err)
      // Set default stats
      setStats({
        projects_count: 0,
        followers_count: 0,
        following_count: 0,
        total_likes_received: 0,
        total_views_received: 0,
        total_comments_received: 0,
        joined_date: new Date().toISOString(),
        last_active: new Date().toISOString()
      })
    }
    
    setLoading(false)
  }, [userId, hasAttempted])

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    fetchStats()
  }, [fetchStats, userId])

  return {
    stats,
    loading,
    error,
    refetch: () => {
      setHasAttempted(false)
      setError(null)
    }
  }
}

// Hook for projects management
export function useProjects(filter: ProjectFilter = {}, pagination: PaginationParams = { page: 1, limit: 10 }) {
  const [projects, setProjects] = useState<PaginatedResponse<ProjectWithDetails> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProjects = useCallback(async () => {
    setLoading(true)
    setError(null)

    const result = await db.getProjects(filter, pagination)
    if (result.success && result.data) {
      setProjects(result.data)
    } else {
      setError(result.error || 'Failed to fetch projects')
    }
    setLoading(false)
  }, [filter, pagination])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  return {
    projects,
    loading,
    error,
    refetch: fetchProjects
  }
}

// Hook for user's own projects
export function useUserProjects(userId?: string, includePrivate = false, pagination: PaginationParams = { page: 1, limit: 10 }) {
  const [projects, setProjects] = useState<PaginatedResponse<Project> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasAttempted, setHasAttempted] = useState(false)

  const fetchProjects = useCallback(async () => {
    if (!userId || hasAttempted) return

    setLoading(true)
    setError(null)
    setHasAttempted(true)

    try {
      const result = await db.getUserProjects(userId, includePrivate, pagination)
      if (result.success && result.data) {
        setProjects(result.data)
      } else {
        setError(result.error || 'Failed to fetch projects')
      }
    } catch (err) {
      setError('Network error occurred')
      console.error('Projects fetch error:', err)
    }
    
    setLoading(false)
  }, [userId, includePrivate, pagination, hasAttempted])

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    fetchProjects()
  }, [fetchProjects, userId])

  return {
    projects,
    loading,
    error,
    refetch: () => {
      setHasAttempted(false)
      setError(null)
    }
  }
}

// Hook for single project
export function useProject(projectId?: string, viewerId?: string) {
  const [project, setProject] = useState<ProjectWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProject = useCallback(async () => {
    if (!projectId) return

    setLoading(true)
    setError(null)

    const result = await db.getProject(projectId, viewerId)
    if (result.success && result.data) {
      setProject(result.data)
    } else {
      setError(result.error || 'Failed to fetch project')
    }
    setLoading(false)
  }, [projectId, viewerId])

  useEffect(() => {
    if (!projectId) {
      setLoading(false)
      return
    }

    fetchProject()
  }, [fetchProject, projectId])

  const likeProject = async (): Promise<boolean> => {
    if (!projectId || !viewerId) return false

    const result = await db.likeProject(projectId, viewerId)
    if (result.success) {
      // Update local state optimistically
      setProject(prev => prev ? {
        ...prev,
        is_liked: true,
        total_likes: prev.total_likes + 1
      } : null)
      return true
    }
    return false
  }

  const unlikeProject = async (): Promise<boolean> => {
    if (!projectId || !viewerId) return false

    const result = await db.unlikeProject(projectId, viewerId)
    if (result.success) {
      // Update local state optimistically
      setProject(prev => prev ? {
        ...prev,
        is_liked: false,
        total_likes: Math.max(0, prev.total_likes - 1)
      } : null)
      return true
    }
    return false
  }

  return {
    project,
    loading,
    error,
    likeProject,
    unlikeProject,
    refetch: fetchProject
  }
}

// Hook for user activity
export function useUserActivity(userId?: string, limit = 20) {
  const [activity, setActivity] = useState<ActivityWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasAttempted, setHasAttempted] = useState(false)

  const fetchActivity = useCallback(async () => {
    if (!userId || hasAttempted) return

    setLoading(true)
    setError(null)
    setHasAttempted(true)

    try {
      const result = await db.getUserActivity(userId, limit)
      if (result.success && result.data) {
        setActivity(result.data)
      } else if (result.error?.includes('relation "user_activity" does not exist') || 
                 result.error?.includes('PGRST116')) {
        // Handle missing table gracefully
        setError('Activity tracking is being set up. Check back soon!')
        setActivity([])
      } else if (result.error?.includes('Could not find a relationship') || 
                 result.error?.includes('PGRST200')) {
        // Handle missing foreign key relationships
        setError('Database relationships are being configured. Check back soon!')
        setActivity([])
      } else {
        setError(result.error || 'Failed to fetch activity')
        setActivity([])
      }
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string }
      if (error.code === 'PGRST116' || error.message?.includes('relation "user_activity" does not exist')) {
        setError('Activity tracking is being set up. Check back soon!')
      } else if (error.code === 'PGRST200' || error.message?.includes('Could not find a relationship')) {
        setError('Database relationships are being configured. Check back soon!')
      } else {
        setError('Network error occurred')
      }
      console.error('Activity fetch error:', err)
      setActivity([])
    }
    
    setLoading(false)
  }, [userId, limit, hasAttempted])

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      setActivity([])
      return
    }

    fetchActivity()
  }, [fetchActivity, userId])

  return {
    activity,
    loading,
    error,
    refetch: fetchActivity
  }
}

// Generic hook for API calls
export function useAsyncOperation<T>() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const execute = async (operation: () => Promise<ApiResponse<T>>): Promise<T | null> => {
    setLoading(true)
    setError(null)

    try {
      const result = await operation()
      
      if (result.success && result.data) {
        return result.data
      } else {
        setError(result.error || 'Operation failed')
        return null
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
      return null
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    error,
    execute,
    clearError: () => setError(null)
  }
}
