'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { UserPlus, Check, X, Loader2 } from 'lucide-react'
import { useAcceptInvite } from '@/hooks/useCollaboration'
import Link from 'next/link'

export default function AcceptInvitePage() {
  const router = useRouter()
  const params = useParams()
  const token = params.token as string
  
  const { acceptInvite, declineInvite, loading } = useAcceptInvite()
  const [status, setStatus] = useState<'idle' | 'accepting' | 'declining' | 'accepted' | 'declined' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleAccept = async () => {
    setStatus('accepting')
    try {
      const result = await acceptInvite(token)
      setStatus('accepted')
      
      // Redirect to project after 2 seconds
      setTimeout(() => {
        router.push(`/projects/${result.project_id}`)
      }, 2000)
    } catch (error) {
      setStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Failed to accept invite')
    }
  }

  const handleDecline = async () => {
    setStatus('declining')
    try {
      await declineInvite(token)
      setStatus('declined')
      
      // Redirect to home after 2 seconds
      setTimeout(() => {
        router.push('/')
      }, 2000)
    } catch (error) {
      setStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Failed to decline invite')
    }
  }

  if (status === 'accepted') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 rounded-xl border border-slate-700 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Invitation Accepted!</h1>
          <p className="text-gray-400 mb-6">
            You&apos;ve been added to the project. Redirecting...
          </p>
          <div className="flex justify-center">
            <div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          </div>
        </div>
      </div>
    )
  }

  if (status === 'declined') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 rounded-xl border border-slate-700 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-gray-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Invitation Declined</h1>
          <p className="text-gray-400 mb-6">
            You won&apos;t be added to this project. Redirecting to home...
          </p>
          <div className="flex justify-center">
            <div className="w-6 h-6 border-2 border-gray-500/30 border-t-gray-500 rounded-full animate-spin" />
          </div>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 rounded-xl border border-slate-700 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Error</h1>
          <p className="text-gray-400 mb-6">
            {errorMessage || 'Something went wrong'}
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
          >
            Go to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-xl border border-slate-700 p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-8 h-8 text-cyan-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Project Collaboration Invite</h1>
          <p className="text-gray-400">
            You&apos;ve been invited to collaborate on a project
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleAccept}
            disabled={loading || status === 'accepting' || status === 'declining'}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-700 disabled:text-gray-500 text-white rounded-lg font-medium transition-colors"
          >
            {status === 'accepting' ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Accepting...
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                Accept Invitation
              </>
            )}
          </button>

          <button
            onClick={handleDecline}
            disabled={loading || status === 'accepting' || status === 'declining'}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-800 disabled:text-gray-600 text-white rounded-lg font-medium transition-colors"
          >
            {status === 'declining' ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Declining...
              </>
            ) : (
              <>
                <X className="w-5 h-5" />
                Decline Invitation
              </>
            )}
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-6">
          By accepting, you&apos;ll be able to view and/or edit this project based on your assigned role.
        </p>
      </div>
    </div>
  )
}
