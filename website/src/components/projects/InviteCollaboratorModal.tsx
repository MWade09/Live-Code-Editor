'use client'

import { useState } from 'react'
import { X, Mail, Send, Check, Copy, Shield, Eye, Edit } from 'lucide-react'
import { useSendInvite, useCollaborationInvites, useCancelInvite } from '@/hooks/useCollaboration'
import type { CollaboratorRole } from '@/types'

interface InviteCollaboratorModalProps {
  projectId: string
  onClose: () => void
}

export default function InviteCollaboratorModal({ projectId, onClose }: InviteCollaboratorModalProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<CollaboratorRole>('editor')
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  
  const { sendInvite, loading: sending, error: sendError } = useSendInvite(projectId)
  const { invites, loading: loadingInvites, refetch } = useCollaborationInvites(projectId)
  const { cancelInvite, loading: canceling } = useCancelInvite(projectId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const result = await sendInvite(email, role)
      setInviteUrl(result.inviteUrl)
      setEmail('')
      refetch()
    } catch {
      // Error handled by hook
    }
  }

  const handleCopy = async () => {
    if (inviteUrl) {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleCancel = async (inviteId: string) => {
    try {
      await cancelInvite(inviteId)
      refetch()
    } catch {
      // Error handled by hook
    }
  }

  const getRoleDescription = (roleValue: CollaboratorRole) => {
    switch (roleValue) {
      case 'viewer':
        return 'Can view project files (read-only)'
      case 'editor':
        return 'Can view and edit project files'
      case 'admin':
        return 'Can manage project and collaborators'
    }
  }

  const getRoleIcon = (roleValue: CollaboratorRole) => {
    switch (roleValue) {
      case 'viewer': return <Eye className="w-4 h-4" />
      case 'editor': return <Edit className="w-4 h-4" />
      case 'admin': return <Shield className="w-4 h-4" />
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-xl border border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Invite Collaborator
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Invite Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@example.com"
                required
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Role
              </label>
              <div className="space-y-2">
                {(['viewer', 'editor', 'admin'] as CollaboratorRole[]).map((roleOption) => (
                  <label
                    key={roleOption}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      role === roleOption
                        ? 'bg-cyan-500/10 border-cyan-500/50'
                        : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={roleOption}
                      checked={role === roleOption}
                      onChange={(e) => setRole(e.target.value as CollaboratorRole)}
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-white font-medium">
                        {getRoleIcon(roleOption)}
                        {roleOption.charAt(0).toUpperCase() + roleOption.slice(1)}
                      </div>
                      <p className="text-sm text-gray-400 mt-0.5">
                        {getRoleDescription(roleOption)}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {sendError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                {sendError}
              </div>
            )}

            <button
              type="submit"
              disabled={sending || !email}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-700 disabled:text-gray-500 text-white rounded-lg font-medium transition-colors"
            >
              {sending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Invitation
                </>
              )}
            </button>
          </form>

          {/* Success Message with Invite URL */}
          {inviteUrl && (
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg space-y-3">
              <div className="flex items-center gap-2 text-green-400 font-medium">
                <Check className="w-5 h-5" />
                Invitation sent successfully!
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-300">Share this invite link:</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inviteUrl}
                    readOnly
                    className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-gray-300 font-mono"
                  />
                  <button
                    onClick={handleCopy}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center gap-2 text-sm"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-green-400" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Pending Invites */}
          <div className="pt-6 border-t border-slate-700">
            <h3 className="text-sm font-medium text-gray-300 mb-3">
              Pending Invitations ({loadingInvites ? '...' : invites?.length || 0})
            </h3>
            {loadingInvites ? (
              <div className="text-sm text-gray-400">Loading...</div>
            ) : invites && invites.length > 0 ? (
              <div className="space-y-2">
                {invites.map((invite) => {
                  const expiresAt = new Date(invite.expires_at)
                  const isExpired = expiresAt < new Date()
                  
                  return (
                    <div
                      key={invite.id}
                      className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{invite.email}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {invite.role} • {isExpired ? 'Expired' : `Expires ${expiresAt.toLocaleDateString()}`}
                        </p>
                      </div>
                      <button
                        onClick={() => handleCancel(invite.id)}
                        disabled={canceling}
                        className="px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No pending invitations</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
