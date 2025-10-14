'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')
  const [message, setMessage] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Supabase automatically handles email verification via the callback
        // We just need to check if the user is now authenticated
        const { data: { user }, error } = await supabase.auth.getUser()

        if (error) throw error

        if (user?.email_confirmed_at) {
          setStatus('success')
          setMessage('Your email has been verified successfully!')
          
          // Redirect to dashboard after 2 seconds
          setTimeout(() => {
            const next = searchParams.get('next') || '/dashboard'
            router.push(next)
          }, 2000)
        } else {
          setStatus('error')
          setMessage('Email verification is pending. Please check your email and click the verification link.')
        }
      } catch (error) {
        setStatus('error')
        setMessage(error instanceof Error ? error.message : 'Failed to verify email')
      }
    }

    verifyEmail()
  }, [router, searchParams, supabase.auth])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-900 flex items-center justify-center p-4">
      {/* Neural Network Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="neural-network opacity-10">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-cyan-400 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      </div>

      <div className="relative w-full max-w-md">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl text-center">
          {/* Status Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4">
            {status === 'verifying' && (
              <div className="bg-blue-500/20">
                <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
              </div>
            )}
            {status === 'success' && (
              <div className="bg-green-500/20">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            )}
            {status === 'error' && (
              <div className="bg-red-500/20">
                <XCircle className="w-8 h-8 text-red-400" />
              </div>
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-white mb-2">
            {status === 'verifying' && 'Verifying Email...'}
            {status === 'success' && 'Email Verified!'}
            {status === 'error' && 'Verification Failed'}
          </h1>

          {/* Message */}
          <p className="text-slate-400 mb-6">
            {message || 'Please wait while we verify your email address...'}
          </p>

          {/* Actions */}
          {status === 'success' && (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2 text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Redirecting to dashboard...</span>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-3">
              <Link
                href="/dashboard"
                className="inline-block px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-[1.02]"
              >
                Go to Dashboard
              </Link>
              <p className="text-sm text-slate-400">
                Need help?{' '}
                <Link href="/auth/login" className="text-cyan-400 hover:text-cyan-300">
                  Try logging in
                </Link>
              </p>
            </div>
          )}
        </div>

        {/* Decorative Elements */}
        <div className="absolute -top-4 -left-4 w-8 h-8 bg-cyan-400/20 rounded-full blur-sm"></div>
        <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-purple-400/20 rounded-full blur-sm"></div>
      </div>
    </div>
  )
}
