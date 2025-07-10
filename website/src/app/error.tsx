'use client'

import { 
  AlertTriangle, 
  RefreshCcw, 
  Home, 
  MessageCircle, 
  Code2,
  Brain
} from "lucide-react"
import Link from "next/link"
import { useEffect } from "react"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application Error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-hidden relative">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-950/20 via-orange-950/20 to-gray-950" />
      <div className="absolute inset-0 bg-grid-pattern opacity-10" />
      <div className="neural-network opacity-30" />
      
      {/* Floating Error Elements */}
      <div className="absolute top-20 left-10 w-2 h-2 bg-red-400 rounded-full animate-pulse" />
      <div className="absolute top-40 right-20 w-1 h-1 bg-orange-400 rounded-full animate-ping" />
      <div className="absolute bottom-40 left-20 w-3 h-3 bg-yellow-400 rounded-full animate-bounce" />
      <div className="absolute bottom-20 right-10 w-2 h-2 bg-red-400 rounded-full animate-pulse" />

      <div className="relative min-h-screen flex items-center justify-center px-4">
        <div className="max-w-4xl mx-auto text-center">
          
          {/* Error Icon */}
          <div className="mb-12">
            <div className="relative inline-block">
              <div className="bg-gradient-to-r from-red-600/20 to-orange-600/20 rounded-full p-8 backdrop-blur-sm border border-red-800/50">
                <AlertTriangle className="h-24 w-24 text-red-400 animate-pulse" />
              </div>
              {/* Pulsing Ring */}
              <div className="absolute inset-0 border-2 border-red-400/30 rounded-full animate-ping" />
            </div>
          </div>

          {/* Error Message */}
          <div className="mb-16">
            <h1 className="text-4xl lg:text-6xl font-black mb-6">
              <span className="bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                SOMETHING WENT WRONG
              </span>
            </h1>
            <p className="text-xl lg:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
              Our AI encountered an unexpected error. Don&apos;t worry, our <span className="text-orange-400 font-semibold">neural networks</span> are 
              already working to fix this issue.
            </p>
            
            {/* Error Details (in development) */}
            {process.env.NODE_ENV === 'development' && (
              <div className="bg-gray-900/50 backdrop-blur-sm border border-red-800/50 rounded-2xl p-6 max-w-2xl mx-auto mb-8">
                <h3 className="text-lg font-semibold text-red-400 mb-4 flex items-center justify-center gap-2">
                  <Code2 className="h-5 w-5" />
                  Development Error Details
                </h3>
                <div className="text-left bg-gray-800 rounded-lg p-4">
                  <p className="text-sm text-gray-300 font-mono break-all">
                    {error.message}
                  </p>
                  {error.digest && (
                    <p className="text-xs text-gray-400 mt-2">
                      Error ID: {error.digest}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mb-16">
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <button 
                onClick={reset}
                className="group bg-gradient-to-r from-red-600 to-orange-400 px-8 py-4 rounded-xl text-lg font-semibold hover:shadow-xl hover:shadow-red-500/25 transition-all duration-300 hover:-translate-y-1"
              >
                <span className="flex items-center gap-3">
                  <RefreshCcw className="h-5 w-5 group-hover:rotate-180 transition-transform duration-500" />
                  Try Again
                </span>
              </button>
              
              <Link href="/">
                <button className="group border border-gray-600 hover:border-orange-400 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-orange-400/10 transition-all duration-300">
                  <span className="flex items-center gap-3">
                    <Home className="h-5 w-5" />
                    Back to Safety
                  </span>
                </button>
              </Link>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-16">
            <h2 className="text-2xl lg:text-3xl font-bold mb-8">
              <span className="bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
                What you can do now
              </span>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-cyan-400/20 rounded-2xl blur group-hover:blur-md transition-all duration-300" />
                <div className="relative bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 hover:border-blue-400/50 transition-all duration-300 group-hover:-translate-y-2">
                  <div className="bg-gradient-to-r from-blue-600 to-cyan-400 p-3 rounded-xl mb-4 w-fit mx-auto">
                    <Home className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">
                    Go Home
                  </h3>
                  <p className="text-gray-400 text-sm mb-4">
                    Return to our homepage and start fresh
                  </p>
                  <Link href="/">
                    <button className="w-full bg-gray-800 hover:bg-blue-600 px-4 py-2 rounded-lg transition-colors">
                      Take me home
                    </button>
                  </Link>
                </div>
              </div>

              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-green-600/20 to-emerald-400/20 rounded-2xl blur group-hover:blur-md transition-all duration-300" />
                <div className="relative bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 hover:border-green-400/50 transition-all duration-300 group-hover:-translate-y-2">
                  <div className="bg-gradient-to-r from-green-600 to-emerald-400 p-3 rounded-xl mb-4 w-fit mx-auto">
                    <MessageCircle className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">
                    Get Help
                  </h3>
                  <p className="text-gray-400 text-sm mb-4">
                    Ask our community for assistance
                  </p>
                  <Link href="/community">
                    <button className="w-full bg-gray-800 hover:bg-green-600 px-4 py-2 rounded-lg transition-colors">
                      Ask community
                    </button>
                  </Link>
                </div>
              </div>

              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-400/20 rounded-2xl blur group-hover:blur-md transition-all duration-300" />
                <div className="relative bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 hover:border-purple-400/50 transition-all duration-300 group-hover:-translate-y-2">
                  <div className="bg-gradient-to-r from-purple-600 to-pink-400 p-3 rounded-xl mb-4 w-fit mx-auto">
                    <Brain className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">
                    Learn More
                  </h3>
                  <p className="text-gray-400 text-sm mb-4">
                    Check our documentation and guides
                  </p>
                  <Link href="/docs">
                    <button className="w-full bg-gray-800 hover:bg-purple-600 px-4 py-2 rounded-lg transition-colors">
                      Browse docs
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Error Code (for tracking) */}
          <div className="pt-8 border-t border-gray-800">
            <p className="text-gray-500 text-sm">
              If this error persists, please report it with error code:{' '}
              <span className="font-mono text-orange-400">
                {error.digest || 'UNKNOWN_ERROR'}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
