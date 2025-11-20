'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface DeploymentStatusResult {
  id: string
  status: 'pending' | 'building' | 'success' | 'failed'
  url: string | null
  error?: string
  platform: 'netlify' | 'vercel'
  completedAt?: string
}

interface UseDeploymentStatusOptions {
  deploymentId: string | null
  enabled?: boolean
  onComplete?: (status: DeploymentStatusResult) => void
  onError?: (error: string) => void
  pollInterval?: number
}

export function useDeploymentStatus(options: UseDeploymentStatusOptions) {
  const {
    deploymentId,
    enabled = true,
    onComplete,
    onError,
    pollInterval = 3000, // Poll every 3 seconds
  } = options

  const [status, setStatus] = useState<DeploymentStatusResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const onCompleteRef = useRef(onComplete)
  const onErrorRef = useRef(onError)

  // Keep refs up to date
  useEffect(() => {
    onCompleteRef.current = onComplete
    onErrorRef.current = onError
  }, [onComplete, onError])

  const checkStatus = useCallback(async () => {
    if (!deploymentId) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/deployment/status/${deploymentId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to check deployment status')
      }

      setStatus(data)

      // If deployment completed, stop polling and call callback
      if (data.status === 'success' || data.status === 'failed') {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }

        if (onCompleteRef.current) {
          onCompleteRef.current(data)
        }

        if (data.status === 'failed' && data.error && onErrorRef.current) {
          onErrorRef.current(data.error)
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)

      if (onErrorRef.current) {
        onErrorRef.current(errorMessage)
      }

      // Stop polling on error
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    } finally {
      setIsLoading(false)
    }
  }, [deploymentId])

  // Start/stop polling based on deploymentId and enabled
  useEffect(() => {
    if (!deploymentId || !enabled) {
      // Clear any existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    // Check status immediately
    checkStatus()

    // Set up polling
    intervalRef.current = setInterval(checkStatus, pollInterval)

    // Cleanup on unmount or when dependencies change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [deploymentId, enabled, pollInterval, checkStatus])

  const refresh = useCallback(() => {
    checkStatus()
  }, [checkStatus])

  return {
    status,
    isLoading,
    error,
    refresh,
    isComplete:
      status?.status === 'success' || status?.status === 'failed' || false,
    isSuccess: status?.status === 'success' || false,
    isFailed: status?.status === 'failed' || false,
    isBuilding:
      status?.status === 'building' || status?.status === 'pending' || false,
  }
}
