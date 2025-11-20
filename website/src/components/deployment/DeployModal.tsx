'use client'

import { useState, useEffect } from 'react'
import { X, Rocket } from 'lucide-react'
import { PlatformSelector } from './PlatformSelector'
import { EnvironmentVars } from './EnvironmentVars'
import { DeploymentStatus } from './DeploymentStatus'
import { useDeployment } from '@/hooks/useDeployment'

interface DeployModalProps {
  projectId: string
  projectName: string
  onClose: () => void
  onDeployComplete?: (url: string) => void
}

export function DeployModal({
  projectId,
  projectName,
  onClose,
  onDeployComplete,
}: DeployModalProps) {
  const [platform, setPlatform] = useState<'netlify' | 'vercel'>('netlify')
  const [envVars, setEnvVars] = useState<{ [key: string]: string }>({})
  const [tokensStatus, setTokensStatus] = useState({
    netlifyConnected: false,
    vercelConnected: false,
  })

  const { deploy, deploymentId, isDeploying, status, error, reset } =
    useDeployment()

  // Check token status on mount
  useEffect(() => {
    const checkTokens = async () => {
      try {
        const response = await fetch('/api/deployment/tokens')
        const data = await response.json()

        setTokensStatus({
          netlifyConnected: data.netlifyConnected || false,
          vercelConnected: data.vercelConnected || false,
        })
      } catch (error) {
        console.error('Failed to check tokens:', error)
      }
    }

    checkTokens()
  }, [])

  const handleDeploy = async () => {
    const result = await deploy({
      projectId,
      platform,
      envVars,
    })

    if (!result.success) {
      // Error is already set by the hook
      console.error('Deployment failed:', result.error)
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleDeploymentComplete = (url: string) => {
    if (onDeployComplete) {
      onDeployComplete(url)
    }
  }

  const canDeploy =
    (platform === 'netlify' && tokensStatus.netlifyConnected) ||
    (platform === 'vercel' && tokensStatus.vercelConnected)

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-xl border border-slate-700 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center">
              <Rocket className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Deploy Project</h2>
              <p className="text-sm text-slate-400">{projectName}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-300 rounded-lg">
              {error}
            </div>
          )}

          {/* If deployment started, show status */}
          {deploymentId ? (
            <DeploymentStatus
              deploymentId={deploymentId}
              onComplete={handleDeploymentComplete}
            />
          ) : (
            <>
              {/* Platform Selection */}
              <PlatformSelector
                selected={platform}
                onSelect={setPlatform}
                netlifyConnected={tokensStatus.netlifyConnected}
                vercelConnected={tokensStatus.vercelConnected}
              />

              {/* Environment Variables */}
              <EnvironmentVars vars={envVars} onChange={setEnvVars} />

              {/* Deployment Info */}
              <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
                <h3 className="text-white font-medium mb-3">What happens next?</h3>
                <ul className="text-sm text-slate-400 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-0.5">•</span>
                    <span>
                      Your project will be deployed to{' '}
                      {platform === 'netlify' ? 'Netlify' : 'Vercel'}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-0.5">•</span>
                    <span>A unique URL will be generated for your site</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-0.5">•</span>
                    <span>You can update your deployment anytime</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-0.5">•</span>
                    <span>
                      Deployment typically takes 30-60 seconds
                    </span>
                  </li>
                </ul>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-slate-700">
          <button
            onClick={handleClose}
            className="px-5 py-2.5 text-slate-400 hover:text-white transition-colors"
            disabled={isDeploying}
          >
            {deploymentId && status === 'success' ? 'Close' : 'Cancel'}
          </button>

          {!deploymentId && (
            <button
              onClick={handleDeploy}
              disabled={!canDeploy || isDeploying}
              className={`
                px-5 py-2.5 rounded-lg font-medium transition-all
                ${
                  canDeploy && !isDeploying
                    ? 'bg-gradient-to-r from-green-600 to-blue-600 text-white hover:from-green-500 hover:to-blue-500 shadow-lg'
                    : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                }
              `}
            >
              {isDeploying ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Deploying...
                </span>
              ) : (
                '🚀 Deploy Now'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
