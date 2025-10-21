'use client'

import { useState } from 'react'
import { Users, UserPlus, Trash2, Shield, Eye, Edit } from 'lucide-react'
import { useProjectCollaborators, useRemoveCollaborator, useUpdateCollaboratorRole } from '@/hooks/useCollaboration'
import type { CollaboratorRole } from '@/types'
import InviteCollaboratorModal from '@/components/projects/InviteCollaboratorModal'

interface CollaboratorsPanelProps {
  projectId: string
  isOwner: boolean
  currentUserId: string
}

export default function CollaboratorsPanel({ projectId, isOwner, currentUserId }: CollaboratorsPanelProps) {
  const { collaborators, loading, error, refetch } = useProjectCollaborators(projectId)
  const { removeCollaborator, loading: removing } = useRemoveCollaborator(projectId)
  const { updateRole, loading: updating } = useUpdateCollaboratorRole(projectId)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)

  const handleRemove = async (collaboratorId: string, username: string) => {
    if (!confirm(`Remove ${username} from this project?`)) return

    setRemovingId(collaboratorId)
    try {
      await removeCollaborator(collaboratorId)
      refetch()
    } catch {
      alert('Failed to remove collaborator')
    } finally {
      setRemovingId(null)
    }
  }

  const handleRoleChange = async (collaboratorId: string, newRole: CollaboratorRole) => {
    try {
      await updateRole(collaboratorId, newRole)
      refetch()
    } catch {
      alert('Failed to update role')
    }
  }

  const getRoleIcon = (role: CollaboratorRole) => {
    switch (role) {
      case 'admin': return <Shield className="w-4 h-4 text-purple-400" />
      case 'editor': return <Edit className="w-4 h-4 text-blue-400" />
      case 'viewer': return <Eye className="w-4 h-4 text-gray-400" />
    }
  }

  const getRoleBadgeColor = (role: CollaboratorRole) => {
    switch (role) {
      case 'admin': return 'bg-purple-500/10 text-purple-400 border-purple-500/20'
      case 'editor': return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      case 'viewer': return 'bg-gray-500/10 text-gray-400 border-gray-500/20'
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Users className="w-5 h-5" />
            Collaborators
          </h3>
        </div>
        <div className="text-gray-400 text-sm">Loading collaborators...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Users className="w-5 h-5" />
            Collaborators
          </h3>
        </div>
        <div className="text-red-400 text-sm">{error}</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Users className="w-5 h-5" />
          Collaborators
          <span className="text-sm font-normal text-gray-400">
            ({collaborators.length})
          </span>
        </h3>
        {isOwner && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-lg border border-cyan-500/20 transition-colors text-sm"
          >
            <UserPlus className="w-4 h-4" />
            Invite
          </button>
        )}
      </div>

      {collaborators.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No collaborators yet</p>
          {isOwner && (
            <p className="text-xs mt-1">Invite team members to work together</p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {collaborators.map((collaborator) => {
            const isCurrentUser = collaborator.user_id === currentUserId
            const canManage = isOwner && !isCurrentUser

            return (
              <div
                key={collaborator.id}
                className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:border-slate-600/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                    {collaborator.user_profiles.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={collaborator.user_profiles.avatar_url}
                        alt={collaborator.user_profiles.username}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-semibold">
                        {collaborator.user_profiles.username[0].toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-white font-medium truncate">
                        {collaborator.user_profiles.full_name || collaborator.user_profiles.username}
                      </p>
                      {isCurrentUser && (
                        <span className="text-xs text-gray-400">(You)</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 truncate">
                      @{collaborator.user_profiles.username}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Role Badge/Selector */}
                  {canManage ? (
                    <select
                      value={collaborator.role}
                      onChange={(e) => handleRoleChange(collaborator.id, e.target.value as CollaboratorRole)}
                      disabled={updating}
                      className={`px-3 py-1.5 rounded-lg border text-sm font-medium flex items-center gap-1.5 bg-slate-900 ${getRoleBadgeColor(collaborator.role)} cursor-pointer hover:opacity-80 transition-opacity`}
                    >
                      <option value="viewer">Viewer</option>
                      <option value="editor">Editor</option>
                      <option value="admin">Admin</option>
                    </select>
                  ) : (
                    <div className={`px-3 py-1.5 rounded-lg border text-sm font-medium flex items-center gap-1.5 ${getRoleBadgeColor(collaborator.role)}`}>
                      {getRoleIcon(collaborator.role)}
                      {collaborator.role}
                    </div>
                  )}

                  {/* Remove Button */}
                  {(canManage || isCurrentUser) && (
                    <button
                      onClick={() => handleRemove(collaborator.id, collaborator.user_profiles.username)}
                      disabled={removing || removingId === collaborator.id}
                      className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                      title={isCurrentUser ? 'Leave project' : 'Remove collaborator'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <InviteCollaboratorModal
          projectId={projectId}
          onClose={() => setShowInviteModal(false)}
        />
      )}
    </div>
  )
}
