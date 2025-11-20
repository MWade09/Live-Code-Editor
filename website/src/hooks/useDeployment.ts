'use client'

import { useState, useCallback } from 'react'

interface DeploymentState {
  isDeploying: boolean
  deploymentId: string | null
  status: 'idle' | 'pending' | 'building' | 'success' | 'failed'
  url: string | null
  error: string | null
  platform: 'netlify' | 'vercel' | null
}

interface DeployOptions {
  projectId: string
  platform: 'netlify' | 'vercel'
  envVars?: { [key: string]: string }
}

export function useDeployment() {
  const [state, setState] = useState<DeploymentState>({
    isDeploying: false,
    deploymentId: null,
    status: 'idle',
    url: null,
    error: null,
    platform: null,
  })

  const deploy = useCallback(async (options: DeployOptions) => {
    const { projectId, platform, envVars } = options

    setState({
      isDeploying: true,
      deploymentId: null,
      status: 'pending',
      url: null,
      error: null,
      platform,
    })

    try {
      const response = await fetch('/api/deployment/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          platform,
          envVars: envVars || {},
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Deployment failed')
      }

      setState({
        isDeploying: true,
        deploymentId: data.deploymentId,
        status: data.status,
        url: data.url,
        error: null,
        platform: data.platform,
      })

      return {
        success: true,
        deploymentId: data.deploymentId,
        url: data.url,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Deployment failed'

      setState({
        isDeploying: false,
        deploymentId: null,
        status: 'failed',
        url: null,
        error: errorMessage,
        platform: null,
      })

      return {
        success: false,
        error: errorMessage,
      }
    }
  }, [])

  const reset = useCallback(() => {
    setState({
      isDeploying: false,
      deploymentId: null,
      status: 'idle',
      url: null,
      error: null,
      platform: null,
    })
  }, [])

  const updateStatus = useCallback(
    (newStatus: 'pending' | 'building' | 'success' | 'failed', url?: string) => {
      setState((prev) => ({
        ...prev,
        status: newStatus,
        isDeploying: newStatus === 'building' || newStatus === 'pending',
        url: url || prev.url,
      }))
    },
    []
  )

  return {
    ...state,
    deploy,
    reset,
    updateStatus,
  }
}
