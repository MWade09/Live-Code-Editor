'use client'

import { useState } from 'react'
import { Rocket, Loader2 } from 'lucide-react'
import { DeployModal } from './DeployModal'

interface DeployButtonProps {
  projectId: string
  projectName: string
  variant?: 'default' | 'icon' | 'text'
  className?: string
  onDeploySuccess?: (url: string) => void
}

export function DeployButton({
  projectId,
  projectName,
  variant = 'default',
  className = '',
  onDeploySuccess,
}: DeployButtonProps) {
  const [showModal, setShowModal] = useState(false)
  const [isDeploying, setIsDeploying] = useState(false)

  const handleDeployComplete = (url: string) => {
    setIsDeploying(false)
    if (onDeploySuccess) {
      onDeploySuccess(url)
    }
  }

  if (variant === 'icon') {
    return (
      <>
        <button
          onClick={() => setShowModal(true)}
          disabled={isDeploying}
          className={`p-2 text-slate-400 hover:text-white transition-colors disabled:opacity-50 ${className}`}
          title="Deploy project"
        >
          {isDeploying ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Rocket className="w-5 h-5" />
          )}
        </button>

        {showModal && (
          <DeployModal
            projectId={projectId}
            projectName={projectName}
            onClose={() => setShowModal(false)}
            onDeployComplete={handleDeployComplete}
          />
        )}
      </>
    )
  }

  if (variant === 'text') {
    return (
      <>
        <button
          onClick={() => setShowModal(true)}
          disabled={isDeploying}
          className={`text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50 ${className}`}
        >
          {isDeploying ? 'Deploying...' : 'Deploy'}
        </button>

        {showModal && (
          <DeployModal
            projectId={projectId}
            projectName={projectName}
            onClose={() => setShowModal(false)}
            onDeployComplete={handleDeployComplete}
          />
        )}
      </>
    )
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        disabled={isDeploying}
        className={`
          inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium
          transition-all disabled:opacity-50 disabled:cursor-not-allowed
          bg-gradient-to-r from-green-600 to-blue-600 text-white
          hover:from-green-500 hover:to-blue-500 shadow-lg
          ${className}
        `}
      >
        {isDeploying ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Deploying...
          </>
        ) : (
          <>
            <Rocket className="w-4 h-4" />
            Deploy
          </>
        )}
      </button>

      {showModal && (
        <DeployModal
          projectId={projectId}
          projectName={projectName}
          onClose={() => setShowModal(false)}
          onDeployComplete={handleDeployComplete}
        />
      )}
    </>
  )
}
