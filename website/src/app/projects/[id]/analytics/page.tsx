'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import {
  ArrowLeft,
  TrendingUp,
  Eye,
  Heart,
  GitFork,
  Calendar,
  Download,
  Users,
  Activity
} from 'lucide-react'
import Link from 'next/link'

interface ProjectStats {
  total_views: number
  total_likes: number
  total_forks: number
  views_today: number
  views_this_week: number
  views_this_month: number
  likes_this_week: number
  likes_this_month: number
}

interface TimeSeriesData {
  date: string
  views: number
  likes: number
  forks: number
}

interface FileView {
  file_name: string
  view_count: number
}

export default function ProjectAnalyticsPage() {
  const [project, setProject] = useState<{ id: string; title: string; user_id: string } | null>(null)
  const [stats, setStats] = useState<ProjectStats | null>(null)
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([])
  const [fileViews, setFileViews] = useState<FileView[]>([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d')
  
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()

  const fetchStats = async () => {
    try {
      const now = new Date()
      const today = new Date(now.setHours(0, 0, 0, 0))
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

      // Get total views
      const { data: totalViews } = await supabase
        .from('project_views')
        .select('id', { count: 'exact' })
        .eq('project_id', params.id)

      // Get views today
      const { data: viewsToday } = await supabase
        .from('project_views')
        .select('id', { count: 'exact' })
        .eq('project_id', params.id)
        .gte('created_at', today.toISOString())

      // Get views this week
      const { data: viewsWeek } = await supabase
        .from('project_views')
        .select('id', { count: 'exact' })
        .eq('project_id', params.id)
        .gte('created_at', weekAgo.toISOString())

      // Get views this month
      const { data: viewsMonth } = await supabase
        .from('project_views')
        .select('id', { count: 'exact' })
        .eq('project_id', params.id)
        .gte('created_at', monthAgo.toISOString())

      // Get total likes
      const { data: totalLikes } = await supabase
        .from('project_likes')
        .select('id', { count: 'exact' })
        .eq('project_id', params.id)

      // Get likes this week
      const { data: likesWeek } = await supabase
        .from('project_likes')
        .select('id', { count: 'exact' })
        .eq('project_id', params.id)
        .gte('created_at', weekAgo.toISOString())

      // Get likes this month
      const { data: likesMonth } = await supabase
        .from('project_likes')
        .select('id', { count: 'exact' })
        .eq('project_id', params.id)
        .gte('created_at', monthAgo.toISOString())

      // Get total forks
      const { data: project } = await supabase
        .from('projects')
        .select('forks_count')
        .eq('id', params.id)
        .single()

      setStats({
        total_views: totalViews?.length || 0,
        total_likes: totalLikes?.length || 0,
        total_forks: project?.forks_count || 0,
        views_today: viewsToday?.length || 0,
        views_this_week: viewsWeek?.length || 0,
        views_this_month: viewsMonth?.length || 0,
        likes_this_week: likesWeek?.length || 0,
        likes_this_month: likesMonth?.length || 0
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const fetchTimeSeriesData = async () => {
    try {
      const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : dateRange === '90d' ? 90 : 365
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

      // Fetch views grouped by date
      const { data: views } = await supabase
        .from('project_views')
        .select('created_at')
        .eq('project_id', params.id)
        .gte('created_at', startDate.toISOString())

      // Fetch likes grouped by date
      const { data: likes } = await supabase
        .from('project_likes')
        .select('created_at')
        .eq('project_id', params.id)
        .gte('created_at', startDate.toISOString())

      // Group by date
      const dateMap = new Map<string, { views: number; likes: number; forks: number }>()
      
      // Initialize dates
      for (let i = 0; i < days; i++) {
        const date = new Date(startDate)
        date.setDate(date.getDate() + i)
        const dateKey = date.toISOString().split('T')[0]
        dateMap.set(dateKey, { views: 0, likes: 0, forks: 0 })
      }

      // Count views per date
      views?.forEach((view) => {
        const dateKey = new Date(view.created_at).toISOString().split('T')[0]
        const existing = dateMap.get(dateKey)
        if (existing) {
          existing.views++
        }
      })

      // Count likes per date
      likes?.forEach((like) => {
        const dateKey = new Date(like.created_at).toISOString().split('T')[0]
        const existing = dateMap.get(dateKey)
        if (existing) {
          existing.likes++
        }
      })

      // Convert to array
      const data = Array.from(dateMap.entries())
        .map(([date, counts]) => ({
          date,
          ...counts
        }))
        .sort((a, b) => a.date.localeCompare(b.date))

      setTimeSeriesData(data)
    } catch (error) {
      console.error('Error fetching time series data:', error)
    }
  }

  const fetchFileViewStats = async () => {
    // For now, create mock data
    // In a real implementation, you'd track which files users view
    setFileViews([
      { file_name: 'index.html', view_count: 45 },
      { file_name: 'styles.css', view_count: 32 },
      { file_name: 'script.js', view_count: 28 },
      { file_name: 'README.md', view_count: 18 },
      { file_name: 'package.json', view_count: 12 }
    ])
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth/login')
          return
        }

        // Fetch project
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('id, title, user_id')
          .eq('id', params.id)
          .single()

        if (projectError) throw projectError

        // Check if user is owner
        if (projectData.user_id !== user.id) {
          router.push(`/projects/${params.id}`)
          return
        }

        setProject(projectData)

        // Fetch overall stats
        await fetchStats()
        
        // Fetch time series data
        await fetchTimeSeriesData()
        
        // Fetch file view stats (simulated for now)
        await fetchFileViewStats()

      } catch (error) {
        console.error('Error fetching analytics:', error)
        router.push(`/projects/${params.id}`)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id, dateRange])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-900 pt-16 sm:pt-18 lg:pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto"></div>
            <p className="text-slate-400 mt-4">Loading analytics...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!project || !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-900 pt-16 sm:pt-18 lg:pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-white mb-2">Analytics not available</h2>
            <p className="text-slate-400 mb-6">Unable to load analytics data.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-900 pt-16 sm:pt-18 lg:pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link
              href={`/projects/${params.id}`}
              className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors mb-4"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Project</span>
            </Link>
            <h1 className="text-3xl font-bold text-white">
              Analytics: {project.title}
            </h1>
            <p className="text-slate-400 mt-2">Track your project&apos;s performance and engagement</p>
          </div>

          {/* Date Range Selector */}
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-slate-400" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as '7d' | '30d' | '90d' | 'all')}
              className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="all">All time</option>
            </select>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Views */}
          <div className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/10 border border-cyan-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-cyan-500/20 rounded-lg">
                <Eye className="w-6 h-6 text-cyan-400" />
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-400">Today</p>
                <p className="text-lg font-bold text-cyan-400">+{stats.views_today}</p>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">{stats.total_views}</h3>
            <p className="text-slate-400 text-sm">Total Views</p>
            <div className="mt-2 flex items-center gap-2 text-xs">
              <span className="text-slate-500">This week:</span>
              <span className="text-cyan-400 font-medium">{stats.views_this_week}</span>
            </div>
          </div>

          {/* Total Likes */}
          <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <Heart className="w-6 h-6 text-purple-400" />
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-400">This Week</p>
                <p className="text-lg font-bold text-purple-400">+{stats.likes_this_week}</p>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">{stats.total_likes}</h3>
            <p className="text-slate-400 text-sm">Total Likes</p>
            <div className="mt-2 flex items-center gap-2 text-xs">
              <span className="text-slate-500">This month:</span>
              <span className="text-purple-400 font-medium">{stats.likes_this_month}</span>
            </div>
          </div>

          {/* Total Forks */}
          <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <GitFork className="w-6 h-6 text-green-400" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">{stats.total_forks}</h3>
            <p className="text-slate-400 text-sm">Total Forks</p>
            <div className="mt-2 flex items-center gap-2 text-xs">
              <span className="text-slate-500">Community impact</span>
            </div>
          </div>

          {/* Engagement Rate */}
          <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border border-orange-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-500/20 rounded-lg">
                <Activity className="w-6 h-6 text-orange-400" />
              </div>
              <Users className="w-5 h-5 text-orange-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">
              {stats.total_views > 0 ? ((stats.total_likes / stats.total_views) * 100).toFixed(1) : '0'}%
            </h3>
            <p className="text-slate-400 text-sm">Engagement Rate</p>
            <div className="mt-2 flex items-center gap-2 text-xs">
              <span className="text-slate-500">Likes per view</span>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Views & Likes Over Time */}
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Views & Likes Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="date"
                  stroke="#94a3b8"
                  tick={{ fill: '#94a3b8' }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="views" stroke="#06b6d4" strokeWidth={2} name="Views" />
                <Line type="monotone" dataKey="likes" stroke="#a855f7" strokeWidth={2} name="Likes" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* File Views Distribution */}
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Most Viewed Files</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={fileViews}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="file_name" stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
                <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Bar dataKey="view_count" fill="#06b6d4" name="Views" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Engagement Breakdown */}
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Engagement Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-cyan-400 mb-2">{stats.views_this_month}</div>
              <p className="text-slate-400">Views This Month</p>
              <div className="mt-2 text-sm text-slate-500">
                {stats.views_this_month > 0 && stats.total_views > 0
                  ? `${((stats.views_this_month / stats.total_views) * 100).toFixed(1)}% of total`
                  : 'No data yet'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400 mb-2">{stats.likes_this_month}</div>
              <p className="text-slate-400">Likes This Month</p>
              <div className="mt-2 text-sm text-slate-500">
                {stats.likes_this_month > 0 && stats.total_likes > 0
                  ? `${((stats.likes_this_month / stats.total_likes) * 100).toFixed(1)}% of total`
                  : 'No data yet'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">
                {stats.total_views > 0 ? (stats.total_forks / (stats.total_views / 100)).toFixed(2) : '0'}%
              </div>
              <p className="text-slate-400">Fork Rate</p>
              <div className="mt-2 text-sm text-slate-500">
                Forks per 100 views
              </div>
            </div>
          </div>
        </div>

        {/* Export Options (Future Enhancement) */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={() => alert('Export feature coming soon!')}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-300 hover:text-white hover:border-slate-600 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export Data
          </button>
        </div>
      </div>
    </div>
  )
}
