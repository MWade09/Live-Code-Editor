import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { CollaboratorWithProfile, CollaborationInvite, CollaboratorRole } from '@/types'

const supabase = createClient()

/**
 * Hook to fetch and manage project collaborators
 */
export function useProjectCollaborators(projectId: string) {
  const [collaborators, setCollaborators] = useState<CollaboratorWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCollaborators = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/projects/${projectId}/collaborators`)
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to fetch collaborators')
      }

      const data = await response.json()
      setCollaborators(data.collaborators || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch collaborators')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    if (projectId) {
      fetchCollaborators()
    }
  }, [projectId, fetchCollaborators])

  return { collaborators, loading, error, refetch: fetchCollaborators }
}

/**
 * Hook to fetch pending collaboration invites
 */
export function useCollaborationInvites(projectId: string) {
  const [invites, setInvites] = useState<CollaborationInvite[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchInvites = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/projects/${projectId}/invites`)
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to fetch invites')
      }

      const data = await response.json()
      setInvites(data.invites || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch invites')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    if (projectId) {
      fetchInvites()
    }
  }, [projectId, fetchInvites])

  return { invites, loading, error, refetch: fetchInvites }
}

/**
 * Hook to send a collaboration invite
 */
export function useSendInvite(projectId: string) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendInvite = async (email: string, role: CollaboratorRole) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/projects/${projectId}/invites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invite')
      }

      return data.invite
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send invite'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { sendInvite, loading, error }
}

/**
 * Hook to accept a collaboration invite
 */
export function useAcceptInvite() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const acceptInvite = async (token: string) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/invites/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to accept invite')
      }

      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to accept invite'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const declineInvite = async (token: string) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/invites/decline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to decline invite')
      }

      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to decline invite'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { acceptInvite, declineInvite, loading, error }
}

/**
 * Hook to update a collaborator's role
 */
export function useUpdateCollaboratorRole(projectId: string) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateRole = async (collaboratorId: string, role: CollaboratorRole) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/projects/${projectId}/collaborators/${collaboratorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update role')
      }

      return data.collaborator
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update role'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { updateRole, loading, error }
}

/**
 * Hook to remove a collaborator
 */
export function useRemoveCollaborator(projectId: string) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const removeCollaborator = async (collaboratorId: string) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/projects/${projectId}/collaborators/${collaboratorId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove collaborator')
      }

      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove collaborator'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { removeCollaborator, loading, error }
}

/**
 * Hook to check if user has specific permission on a project
 */
export function useProjectPermission(projectId: string, requiredRole: CollaboratorRole = 'viewer') {
  const [hasPermission, setHasPermission] = useState(false)
  const [userRole, setUserRole] = useState<CollaboratorRole | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkPermission = async () => {
      try {
        setLoading(true)
        setError(null)

        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setHasPermission(false)
          setLoading(false)
          return
        }

        // Check if user is the project owner
        const { data: project } = await supabase
          .from('projects')
          .select('user_id')
          .eq('id', projectId)
          .single()

        if (project?.user_id === user.id) {
          setHasPermission(true)
          setUserRole('admin')
          setLoading(false)
          return
        }

        // Check collaborator role
        const { data: collaborator } = await supabase
          .from('project_collaborators')
          .select('role')
          .eq('project_id', projectId)
          .eq('user_id', user.id)
          .eq('status', 'accepted')
          .single()

        if (collaborator) {
          const role = collaborator.role as CollaboratorRole
          setUserRole(role)
          
          // Check role hierarchy: viewer < editor < admin
          const roleHierarchy = { viewer: 1, editor: 2, admin: 3 }
          setHasPermission(roleHierarchy[role] >= roleHierarchy[requiredRole])
        } else {
          setHasPermission(false)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to check permission')
        setHasPermission(false)
      } finally {
        setLoading(false)
      }
    }

    if (projectId) {
      checkPermission()
    }
  }, [projectId, requiredRole])

  return { hasPermission, userRole, loading, error }
}

/**
 * Hook to cancel a pending invite
 */
export function useCancelInvite(projectId: string) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cancelInvite = async (inviteId: string) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/projects/${projectId}/invites/${inviteId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel invite')
      }

      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to cancel invite'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { cancelInvite, loading, error }
}
