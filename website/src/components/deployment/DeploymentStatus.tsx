'use client'

import { Loader2, CheckCircle, XCircle, Clock, ExternalLink } from 'lucide-react'
import { useDeploymentStatus } from '@/hooks/useDeploymentStatus'
import { formatDeploymentStatus } from '@/lib/deployment/deployment-helpers'

interface DeploymentStatusProps {
  deploymentId: string | null
  onComplete?: (url: string) => void
}

export function DeploymentStatus({
  deploymentId,
  onComplete,
}: DeploymentStatusProps) {
  const { status, isLoading, isBuilding, isSuccess, isFailed } =
    useDeploymentStatus({
      deploymentId,
      enabled: !!deploymentId,
      onComplete: (result) => {
        if (result.status === 'success' && result.url && onComplete) {
          onComplete(result.url)
        }
      },
    })

  if (!deploymentId) {
    return null
  }

  const getStatusIcon = () => {
    if (isLoading && !status) {
      return <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
    }

    if (isFailed) {
      return <XCircle className="w-5 h-5 text-red-500" />
    }

    if (isSuccess) {
      return <CheckCircle className="w-5 h-5 text-green-500" />
    }

    if (isBuilding) {
      return <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
    }

    return <Clock className="w-5 h-5 text-yellow-500" />
  }

  const getStatusMessage = () => {
    if (isLoading && !status) {
      return 'Checking deployment status...'
    }

    if (!status) {
      return 'Initializing deployment...'
    }

    const formatted = formatDeploymentStatus(status.status)

    if (status.status === 'success') {
      return '🎉 Deployment successful!'
    }

    if (status.status === 'failed') {
      return `❌ Deployment failed${status.error ? `: ${status.error}` : ''}`
    }

    if (status.status === 'building') {
      return '🔨 Building your project...'
    }

    return `${formatted.icon} ${formatted.label}`
  }

  const getProgressBar = () => {
    if (isSuccess) return 100
    if (isFailed) return 100
    if (isBuilding) return 66
    return 33
  }

  return (
    <div className="space-y-4">
      {/* Status Header */}
      <div className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
        <div>{getStatusIcon()}</div>
        <div className="flex-1">
          <div className="text-white font-medium">{getStatusMessage()}</div>
          {status?.platform && (
            <div className="text-sm text-slate-400 mt-1">
              Platform: {status.platform === 'netlify' ? 'Netlify' : 'Vercel'}
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative w-full h-2 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ${
            isSuccess
              ? 'bg-green-500'
              : isFailed
              ? 'bg-red-500'
              : 'bg-blue-500'
          }`}
          style={{ width: `${getProgressBar()}%` }}
        >
          {isBuilding && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
          )}
        </div>
      </div>

      {/* Deploy URL */}
      {status?.url && isSuccess && (
        <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
          <div className="text-sm font-medium text-green-400 mb-2">
            Your site is live! 🚀
          </div>
          <a
            href={status.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors break-all"
          >
            {status.url}
            <ExternalLink className="w-4 h-4 flex-shrink-0" />
          </a>
        </div>
      )}

      {/* Error Message */}
      {status?.error && isFailed && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <div className="text-sm font-medium text-red-400 mb-1">
            Error Details:
          </div>
          <div className="text-sm text-red-300">{status.error}</div>
        </div>
      )}

      {/* Deployment Info */}
      {status && (
        <div className="text-xs text-slate-500 space-y-1">
          <div>Deployment ID: {deploymentId.slice(0, 8)}...</div>
          {status.completedAt && (
            <div>
              Completed at: {new Date(status.completedAt).toLocaleTimeString()}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
