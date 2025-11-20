'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Rocket,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
  Filter,
  Calendar,
  Package,
} from 'lucide-react'
import Link from 'next/link'

interface Deployment {
  id: string
  project_id: string
  platform: 'netlify' | 'vercel'
  status: 'pending' | 'building' | 'success' | 'failed'
  deploy_url: string | null
  error_message: string | null
  created_at: string
  updated_at: string
  project?: {
    id: string
    title: string
  }
}

export default function DeploymentsPage() {
  const [deployments, setDeployments] = useState<Deployment[]>([])
  const [loading, setLoading] = useState(true)
  const [filterPlatform, setFilterPlatform] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  useEffect(() => {
    loadDeployments()
  }, [])

  async function loadDeployments() {
    try {
      setLoading(true)
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        window.location.href = '/login'
        return
      }

      // Get deployments with project info
      const { data, error } = await supabase
        .from('deployments')
        .select(
          `
          id,
          project_id,
          platform,
          status,
          deploy_url,
          error_message,
          created_at,
          updated_at,
          projects:project_id (
            id,
            title
          )
        `
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Failed to load deployments:', error)
        return
      }

      // Transform the data to flatten the project relationship
      const transformedData =
        data?.map((d) => ({
          ...d,
          project: Array.isArray(d.projects) ? d.projects[0] : d.projects,
          projects: undefined,
        })) || []

      setDeployments(transformedData)
    } catch (error) {
      console.error('Error loading deployments:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'building':
        return <Clock className="w-5 h-5 text-blue-500 animate-pulse" />
      case 'pending':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'success':
        return 'Success'
      case 'failed':
        return 'Failed'
      case 'building':
        return 'Building'
      case 'pending':
        return 'Pending'
      default:
        return status
    }
  }

  const getPlatformBadge = (platform: string) => {
    const colors = {
      netlify: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
      vercel: 'bg-black text-white dark:bg-white dark:text-black',
    }

    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded ${
          colors[platform as keyof typeof colors] || 'bg-gray-100 text-gray-800'
        }`}
      >
        {platform}
      </span>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    })
  }

  const filteredDeployments = deployments.filter((d) => {
    if (filterPlatform !== 'all' && d.platform !== filterPlatform) return false
    if (filterStatus !== 'all' && d.status !== filterStatus) return false
    return true
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading deployments...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Rocket className="w-8 h-8 text-blue-600" />
                Deployment History
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                View and manage your deployment history
              </p>
            </div>
            <Link
              href="/settings#deployment"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Settings
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Filters:
              </span>
            </div>

            {/* Platform Filter */}
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-gray-500" />
              <select
                value={filterPlatform}
                onChange={(e) => setFilterPlatform(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Platforms</option>
                <option value="netlify">Netlify</option>
                <option value="vercel">Vercel</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value="success">Success</option>
                <option value="building">Building</option>
                <option value="failed">Failed</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            {/* Results count */}
            <div className="ml-auto text-sm text-gray-600 dark:text-gray-400">
              {filteredDeployments.length} deployment
              {filteredDeployments.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Deployments List */}
        {filteredDeployments.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
            <Rocket className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {deployments.length === 0 ? 'No deployments yet' : 'No deployments match filters'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {deployments.length === 0
                ? 'Deploy your first project to see it here'
                : 'Try adjusting your filters'}
            </p>
            {deployments.length === 0 && (
              <Link
                href="/projects"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Rocket className="w-5 h-5" />
                Go to Projects
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredDeployments.map((deployment) => (
              <div
                key={deployment.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusIcon(deployment.status)}
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {deployment.project?.title || 'Unknown Project'}
                      </h3>
                      {getPlatformBadge(deployment.platform)}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatDate(deployment.created_at)}
                      </span>
                      <span className="font-medium">{getStatusText(deployment.status)}</span>
                    </div>

                    {deployment.error_message && (
                      <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-sm text-red-800 dark:text-red-200">
                          <strong>Error:</strong> {deployment.error_message}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    {deployment.deploy_url && (
                      <a
                        href={deployment.deploy_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        View Site
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    {deployment.project && (
                      <Link
                        href={`/projects/${deployment.project.id}`}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
                      >
                        View Project
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
