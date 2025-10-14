'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Mail, X, RefreshCw, CheckCircle } from 'lucide-react'

interface VerifyEmailBannerProps {
  email: string
  onDismiss?: () => void
}

export function VerifyEmailBanner({ email, onDismiss }: VerifyEmailBannerProps) {
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [dismissed, setDismissed] = useState(false)
  const supabase = createClient()

  const handleResend = async () => {
    setSending(true)
    setError('')
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      })

      if (error) throw error

      setSent(true)
      setTimeout(() => setSent(false), 5000) // Hide success message after 5 seconds
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to resend email')
    } finally {
      setSending(false)
    }
  }

  const handleDismiss = () => {
    setDismissed(true)
    // Store dismissal in localStorage so it doesn't show again this session
    localStorage.setItem('email_verification_dismissed', 'true')
    onDismiss?.()
  }

  if (dismissed) return null

  return (
    <div className="bg-gradient-to-r from-orange-500/20 to-yellow-500/20 border border-orange-500/30 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
            <Mail className="w-5 h-5 text-orange-400" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold mb-1">
            Verify Your Email Address
          </h3>
          <p className="text-slate-300 text-sm mb-3">
            We sent a verification link to <span className="font-medium text-white">{email}</span>. 
            Please check your inbox and click the link to verify your account.
          </p>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3">
            {!sent ? (
              <button
                onClick={handleResend}
                disabled={sending}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 rounded-lg text-orange-300 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Resend Email
                  </>
                )}
              </button>
            ) : (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/20 border border-green-500/30 rounded-lg text-green-300 text-sm font-medium">
                <CheckCircle className="w-4 h-4" />
                Email sent! Check your inbox
              </div>
            )}

            <a
              href={`https://mail.google.com`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-orange-300 hover:text-orange-200 underline transition-colors"
            >
              Open Gmail
            </a>
          </div>

          {error && (
            <p className="text-red-400 text-sm mt-2">
              {error}
            </p>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-slate-400 hover:text-white transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
