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

  const fetchProfile = useCallback(async () => {
    if (!userId) return

    setLoading(true)
    setError(null)

    const result = await db.getUserProfile(userId)
    if (result.success && result.data) {
      setProfile(result.data)
    } else {
      setError(result.error || 'Failed to fetch profile')
    }
    setLoading(false)
  }, [userId])

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

  const fetchStats = useCallback(async () => {
    if (!userId) return

    setLoading(true)
    setError(null)

    const result = await db.getUserStats(userId)
    if (result.success && result.data) {
      setStats(result.data)
    } else {
      setError(result.error || 'Failed to fetch stats')
    }
    setLoading(false)
  }, [userId])

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
    refetch: fetchStats
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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) {
      setProjects({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        total_pages: 0,
        has_next: false,
        has_prev: false
      })
      setLoading(false)
      setError(null)
      return
    }

    const fetchProjects = async () => {
      setLoading(true)
      setError(null)

      try {
        const result = await db.getUserProjects(userId, includePrivate, pagination)
        if (result.success && result.data) {
          setProjects(result.data)
          setError(null)
        } else {
          setError(result.error || 'Failed to fetch user projects')
          setProjects({
            data: [],
            total: 0,
            page: 1,
            limit: 10,
            total_pages: 0,
            has_next: false,
            has_prev: false
          })
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user projects'
        setError(errorMessage)
        setProjects({
          data: [],
          total: 0,
          page: 1,
          limit: 10,
          total_pages: 0,
          has_next: false,
          has_prev: false
        })
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]) // Only userId dependency to prevent infinite loops

  const refetch = useCallback(async () => {
    if (!userId) return

    setLoading(true)
    setError(null)

    try {
      const result = await db.getUserProjects(userId, includePrivate, pagination)
      if (result.success && result.data) {
        setProjects(result.data)
        setError(null)
      } else {
        setError(result.error || 'Failed to fetch user projects')
        setProjects({
          data: [],
          total: 0,
          page: 1,
          limit: 10,
          total_pages: 0,
          has_next: false,
          has_prev: false
        })
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user projects'
      setError(errorMessage)
      setProjects({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        total_pages: 0,
        has_next: false,
        has_prev: false
      })
    } finally {
      setLoading(false)
    }
  }, [userId, includePrivate, pagination])

  return {
    projects,
    loading,
    error,
    refetch
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

  const fetchActivity = useCallback(async () => {
    if (!userId) return

    setLoading(true)
    setError(null)

    const result = await db.getUserActivity(userId, limit)
    if (result.success && result.data) {
      setActivity(result.data)
    } else {
      setError(result.error || 'Failed to fetch activity')
    }
    setLoading(false)
  }, [userId, limit])

  useEffect(() => {
    if (!userId) {
      setLoading(false)
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
