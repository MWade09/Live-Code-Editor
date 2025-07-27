import { createClient } from '@/lib/supabase/client'
import type {
  UserProfile,
  InsertUserProfile,
  UpdateUserProfile,
  Project,
  InsertProject,
  UpdateProject,
  ProjectWithDetails,
  UserStats,
  PaginatedResponse,
  PaginationParams,
  ProjectFilter,
  ActivityWithDetails,
  ApiResponse
} from '@/types'

export class DatabaseService {
  private supabase = createClient()

  // ===== USER PROFILE METHODS =====

  async getUserProfile(userId: string): Promise<ApiResponse<UserProfile>> {
    try {
      const { data, error } = await this.supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error

      return { success: true, data }
    } catch (error) {
      console.error('Error fetching user profile:', error)
      return { success: false, error: 'Failed to fetch user profile' }
    }
  }

  async getUserProfileByUsername(username: string): Promise<ApiResponse<UserProfile>> {
    try {
      const { data, error } = await this.supabase
        .from('user_profiles')
        .select('*')
        .eq('username', username)
        .single()

      if (error) throw error

      return { success: true, data }
    } catch (error) {
      console.error('Error fetching user profile by username:', error)
      return { success: false, error: 'User not found' }
    }
  }

  async createUserProfile(profile: InsertUserProfile): Promise<ApiResponse<UserProfile>> {
    try {
      const { data, error } = await this.supabase
        .from('user_profiles')
        .insert(profile)
        .select()
        .single()

      if (error) throw error

      return { success: true, data }
    } catch (error) {
      console.error('Error creating user profile:', error)
      return { success: false, error: 'Failed to create user profile' }
    }
  }

  async updateUserProfile(userId: string, updates: UpdateUserProfile): Promise<ApiResponse<UserProfile>> {
    try {
      const { data, error } = await this.supabase
        .from('user_profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error

      // Track user activity
      await this.createUserActivity(userId, 'profile_updated', { fields: Object.keys(updates) })

      return { success: true, data }
    } catch (error) {
      console.error('Error updating user profile:', error)
      return { success: false, error: 'Failed to update user profile' }
    }
  }

  async checkUsernameAvailability(username: string, excludeUserId?: string): Promise<ApiResponse<boolean>> {
    try {
      let query = this.supabase
        .from('user_profiles')
        .select('id')
        .eq('username', username)

      if (excludeUserId) {
        query = query.neq('id', excludeUserId)
      }

      const { data, error } = await query

      if (error) throw error

      return { success: true, data: data.length === 0 }
    } catch (error) {
      console.error('Error checking username availability:', error)
      return { success: false, error: 'Failed to check username availability' }
    }
  }

  async getUserStats(userId: string): Promise<ApiResponse<UserStats>> {
    try {
      // Get basic user data
      const { data: profile, error: profileError } = await this.supabase
        .from('user_profiles')
        .select('created_at, last_seen_at')
        .eq('id', userId)
        .single()

      if (profileError) throw profileError

      // Get project count
      const { count: projectsCount } = await this.supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      // Get followers count
      const { count: followersCount } = await this.supabase
        .from('user_follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId)

      // Get following count
      const { count: followingCount } = await this.supabase
        .from('user_follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId)

      // Get total likes received on user's projects
      const { data: userProjects } = await this.supabase
        .from('projects')
        .select('id')
        .eq('user_id', userId)

      let totalLikes = 0
      let totalViews = 0
      let totalComments = 0

      if (userProjects && userProjects.length > 0) {
        const projectIds = userProjects.map(p => p.id)

        // Get likes
        const { count: likesCount } = await this.supabase
          .from('project_likes')
          .select('*', { count: 'exact', head: true })
          .in('project_id', projectIds)

        // Get views
        const { count: viewsCount } = await this.supabase
          .from('project_views')
          .select('*', { count: 'exact', head: true })
          .in('project_id', projectIds)

        // Get comments
        const { count: commentsCount } = await this.supabase
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .in('project_id', projectIds)

        totalLikes = likesCount || 0
        totalViews = viewsCount || 0
        totalComments = commentsCount || 0
      }

      const stats: UserStats = {
        projects_count: projectsCount || 0,
        followers_count: followersCount || 0,
        following_count: followingCount || 0,
        total_likes_received: totalLikes,
        total_views_received: totalViews,
        total_comments_received: totalComments,
        joined_date: profile.created_at,
        last_active: profile.last_seen_at || profile.created_at
      }

      return { success: true, data: stats }
    } catch (error) {
      console.error('Error fetching user stats:', error)
      return { success: false, error: 'Failed to fetch user stats' }
    }
  }

  // ===== PROJECT METHODS =====

  async createProject(project: InsertProject): Promise<ApiResponse<Project>> {
    try {
      const { data, error } = await this.supabase
        .from('projects')
        .insert({
          ...project,
          published_at: project.status === 'published' ? new Date().toISOString() : null
        })
        .select()
        .single()

      if (error) throw error

      // Track activity
      await this.createUserActivity(project.user_id, 'project_created', { project_id: data.id, title: data.title })

      return { success: true, data }
    } catch (error) {
      console.error('Error creating project:', error)
      return { success: false, error: 'Failed to create project' }
    }
  }

  async getProject(projectId: string, viewerId?: string): Promise<ApiResponse<ProjectWithDetails>> {
    try {
      const { data, error } = await this.supabase
        .from('projects')
        .select(`
          *,
          user_profiles!inner (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('id', projectId)
        .single()

      if (error) throw error

      // Get stats
      const { count: likesCount } = await this.supabase
        .from('project_likes')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId)

      const { count: commentsCount } = await this.supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId)

      const { count: viewsCount } = await this.supabase
        .from('project_views')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId)

      // Check if viewer has liked
      let isLiked = false
      if (viewerId) {
        const { data: likeData } = await this.supabase
          .from('project_likes')
          .select('id')
          .eq('project_id', projectId)
          .eq('user_id', viewerId)
          .single()
        
        isLiked = !!likeData
      }

      const projectWithDetails: ProjectWithDetails = {
        ...data,
        total_likes: likesCount || 0,
        total_comments: commentsCount || 0,
        total_views: viewsCount || 0,
        is_liked: isLiked
      }

      // Record view if viewer is provided and not the owner
      if (viewerId && viewerId !== data.user_id) {
        await this.recordProjectView(projectId, viewerId)
      }

      return { success: true, data: projectWithDetails }
    } catch (error) {
      console.error('Error fetching project:', error)
      return { success: false, error: 'Failed to fetch project' }
    }
  }

  async updateProject(projectId: string, updates: UpdateProject): Promise<ApiResponse<Project>> {
    try {
      const { data, error } = await this.supabase
        .from('projects')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
          published_at: updates.status === 'published' ? new Date().toISOString() : undefined
        })
        .eq('id', projectId)
        .select()
        .single()

      if (error) throw error

      return { success: true, data }
    } catch (error) {
      console.error('Error updating project:', error)
      return { success: false, error: 'Failed to update project' }
    }
  }

  async deleteProject(projectId: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await this.supabase
        .from('projects')
        .delete()
        .eq('id', projectId)

      if (error) throw error

      return { success: true }
    } catch (error) {
      console.error('Error deleting project:', error)
      return { success: false, error: 'Failed to delete project' }
    }
  }

  async getProjects(
    filter: ProjectFilter = {},
    pagination: PaginationParams = { page: 1, limit: 10 }
  ): Promise<ApiResponse<PaginatedResponse<ProjectWithDetails>>> {
    try {
      let query = this.supabase
        .from('projects')
        .select(`
          *,
          user_profiles!inner (
            id,
            username,
            full_name,
            avatar_url
          )
        `, { count: 'exact' })
        .eq('status', 'published')
        .eq('is_public', true)

      // Apply filters
      if (filter.language) {
        query = query.eq('language', filter.language)
      }
      if (filter.framework) {
        query = query.eq('framework', filter.framework)
      }
      if (filter.difficulty) {
        query = query.eq('difficulty_level', filter.difficulty)
      }
      if (filter.tags && filter.tags.length > 0) {
        query = query.overlaps('tags', filter.tags)
      }
      if (filter.is_featured) {
        query = query.eq('is_featured', true)
      }
      if (filter.author) {
        query = query.eq('user_profiles.username', filter.author)
      }
      if (filter.search) {
        query = query.or(`title.ilike.%${filter.search}%,description.ilike.%${filter.search}%`)
      }

      // Apply pagination and sorting
      const offset = (pagination.page - 1) * pagination.limit
      query = query
        .order(pagination.sort_by || 'created_at', { ascending: pagination.sort_order === 'asc' })
        .range(offset, offset + pagination.limit - 1)

      const { data, error, count } = await query

      if (error) throw error

      // Get stats for each project (simplified for performance)
      const projectsWithStats: ProjectWithDetails[] = (data || []).map(project => ({
        ...project,
        total_likes: project.likes_count || 0,
        total_comments: project.comments_count || 0,
        total_views: project.views_count || 0,
        is_liked: false // Will be populated separately if needed
      }))

      const total = count || 0
      const totalPages = Math.ceil(total / pagination.limit)

      const result: PaginatedResponse<ProjectWithDetails> = {
        data: projectsWithStats,
        total,
        page: pagination.page,
        limit: pagination.limit,
        total_pages: totalPages,
        has_next: pagination.page < totalPages,
        has_prev: pagination.page > 1
      }

      return { success: true, data: result }
    } catch (error) {
      console.error('Error fetching projects:', error)
      return { success: false, error: 'Failed to fetch projects' }
    }
  }

  async getUserProjects(
    userId: string,
    includePrivate = false,
    pagination: PaginationParams = { page: 1, limit: 10 }
  ): Promise<ApiResponse<PaginatedResponse<Project>>> {
    try {
      let query = this.supabase
        .from('projects')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)

      if (!includePrivate) {
        query = query.eq('is_public', true).eq('status', 'published')
      }

      const offset = (pagination.page - 1) * pagination.limit
      query = query
        .order(pagination.sort_by || 'created_at', { ascending: pagination.sort_order === 'asc' })
        .range(offset, offset + pagination.limit - 1)

      const { data, error, count } = await query

      if (error) throw error

      const total = count || 0
      const totalPages = Math.ceil(total / pagination.limit)

      const result: PaginatedResponse<Project> = {
        data: data || [],
        total,
        page: pagination.page,
        limit: pagination.limit,
        total_pages: totalPages,
        has_next: pagination.page < totalPages,
        has_prev: pagination.page > 1
      }

      return { success: true, data: result }
    } catch (error) {
      console.error('Error fetching user projects:', error)
      return { success: false, error: 'Failed to fetch user projects' }
    }
  }

  // ===== INTERACTION METHODS =====

  async likeProject(projectId: string, userId: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await this.supabase
        .from('project_likes')
        .insert({ project_id: projectId, user_id: userId })

      if (error) throw error

      // Increment counter
      await this.supabase
        .from('projects')
        .update({ likes_count: await this.getProjectLikesCount(projectId) })
        .eq('id', projectId)

      // Track activity
      await this.createUserActivity(userId, 'project_liked', { project_id: projectId })

      return { success: true }
    } catch (error) {
      console.error('Error liking project:', error)
      return { success: false, error: 'Failed to like project' }
    }
  }

  async unlikeProject(projectId: string, userId: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await this.supabase
        .from('project_likes')
        .delete()
        .eq('project_id', projectId)
        .eq('user_id', userId)

      if (error) throw error

      // Decrement counter
      await this.supabase
        .from('projects')
        .update({ likes_count: await this.getProjectLikesCount(projectId) })
        .eq('id', projectId)

      return { success: true }
    } catch (error) {
      console.error('Error unliking project:', error)
      return { success: false, error: 'Failed to unlike project' }
    }
  }

  async recordProjectView(projectId: string, userId?: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await this.supabase
        .from('project_views')
        .insert({
          project_id: projectId,
          user_id: userId || null
        })

      if (error) throw error

      // Increment counter
      await this.supabase
        .from('projects')
        .update({ views_count: await this.getProjectViewsCount(projectId) })
        .eq('id', projectId)

      return { success: true }
    } catch (error) {
      console.error('Error recording project view:', error)
      return { success: false, error: 'Failed to record project view' }
    }
  }

  // ===== ACTIVITY TRACKING =====

  async createUserActivity(
    userId: string,
    activityType: 'project_created' | 'project_liked' | 'project_commented' | 'user_followed' | 'profile_updated',
    activityData: Record<string, unknown>,
    relatedId?: string
  ): Promise<ApiResponse<void>> {
    try {
      const { error } = await this.supabase
        .from('user_activity')
        .insert({
          user_id: userId,
          activity_type: activityType,
          activity_data: activityData,
          related_id: relatedId || null
        })

      if (error) throw error

      return { success: true }
    } catch (error) {
      console.error('Error creating user activity:', error)
      return { success: false, error: 'Failed to create user activity' }
    }
  }

  async getUserActivity(userId: string, limit = 20): Promise<ApiResponse<ActivityWithDetails[]>> {
    try {
      // First get the activity data without the problematic join
      const { data: activities, error: activityError } = await this.supabase
        .from('user_activity')
        .select(`
          *,
          user_profiles!inner (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (activityError) throw activityError

      // Then manually fetch related project data for project-related activities
      const enrichedActivities = await Promise.all(
        (activities || []).map(async (activity) => {
          let relatedProject = null
          
          if (activity.related_id && 
              ['project_created', 'project_liked', 'project_commented'].includes(activity.activity_type)) {
            const { data: project } = await this.supabase
              .from('projects')
              .select('id, title')
              .eq('id', activity.related_id)
              .single()
            
            relatedProject = project
          }

          return {
            ...activity,
            projects: relatedProject // Keep the same field name for compatibility
          }
        })
      )

      return { success: true, data: enrichedActivities || [] }
    } catch (error) {
      console.error('Error fetching user activity:', error)
      return { success: false, error: 'Failed to fetch user activity' }
    }
  }

  // ===== UTILITY METHODS =====

  private async getProjectLikesCount(projectId: string): Promise<number> {
    const { count } = await this.supabase
      .from('project_likes')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId)
    
    return count || 0
  }

  private async getProjectViewsCount(projectId: string): Promise<number> {
    const { count } = await this.supabase
      .from('project_views')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId)
    
    return count || 0
  }

  async updateLastSeen(userId: string): Promise<void> {
    try {
      await this.supabase
        .from('user_profiles')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('id', userId)
    } catch (error) {
      console.error('Error updating last seen:', error)
    }
  }
}

// Export a singleton instance
export const db = new DatabaseService()
