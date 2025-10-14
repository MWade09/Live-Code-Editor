'use client'

import { User } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import { 
  Code, 
  Play,
  FileText,
  Folder,
  Zap,
  Users,
  Heart,
  Eye,
  Activity,
  Shield,
  Brain
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useUserProfile, useUserProjects, useUserStats, useUserActivity } from '@/hooks/useDatabase'
import { formatDistanceToNow } from 'date-fns'
import { VerifyEmailBanner } from '@/components/auth/verify-email-banner'

interface DashboardContentProps {
  user: User
}

interface AIUsageRecord {
  id: string
  user_id: string
  model: string
  tokens_used: number
  cost_usd: number
  markup_usd: number
  total_usd: number
  created_at: string
}

export function DashboardContent({ user }: DashboardContentProps) {
  // Database hooks for real user data
  const { profile, loading: profileLoading, updateProfile } = useUserProfile(user.id)
  // Include private projects for owner's dashboard view
  const { projects, loading: projectsLoading, error: projectsError } = useUserProjects(user.id, true)
  const { stats, loading: statsLoading } = useUserStats(user.id)
  const { activity, loading: activityLoading, error: activityError } = useUserActivity(user.id)

  // AI Usage state
  const [aiUsage, setAiUsage] = useState<{
    monthlyTokens: number
    monthlyCost: number
    loading: boolean
  }>({
    monthlyTokens: 0,
    monthlyCost: 0,
    loading: true
  })

  // Fetch AI usage for current month
  useEffect(() => {
    async function fetchAIUsage() {
      try {
        const currentMonthStart = new Date()
        currentMonthStart.setDate(1)
        currentMonthStart.setHours(0, 0, 0, 0)
        
        const response = await fetch('/api/ai/usage')
        if (response.ok) {
          const data: AIUsageRecord[] = await response.json()
          const currentMonthData = data.filter((record: AIUsageRecord) => 
            new Date(record.created_at) >= currentMonthStart
          )
          
          const monthlyTokens = currentMonthData.reduce((sum: number, record: AIUsageRecord) => 
            sum + (record.tokens_used || 0), 0
          )
          const monthlyCost = currentMonthData.reduce((sum: number, record: AIUsageRecord) => 
            sum + (record.total_usd || 0), 0
          )
          
          setAiUsage({ monthlyTokens, monthlyCost, loading: false })
        } else {
          setAiUsage({ monthlyTokens: 0, monthlyCost: 0, loading: false })
        }
      } catch (error) {
        console.error('Error fetching AI usage:', error)
        setAiUsage({ monthlyTokens: 0, monthlyCost: 0, loading: false })
      }
    }
    
    fetchAIUsage()
  }, [user.id])

  // Debug logging
  useEffect(() => {
    if (projectsError) {
      console.error('Projects error:', projectsError)
    }
    if (activityError) {
      console.error('Activity error:', activityError)
    }
  }, [projectsError, activityError])

  // Create initial profile if user doesn't have one
  useEffect(() => {
    if (!profileLoading && !profile && user) {
      // Create basic profile from auth metadata
      const basicProfile = {
        username: user.email?.split('@')[0] || `user_${Date.now()}`,
        full_name: user.user_metadata?.full_name || undefined,
        avatar_url: user.user_metadata?.avatar_url || undefined,
        bio: undefined,
        skills: [],
        interests: [],
        preferred_languages: [],
        coding_experience: 'beginner' as const,
        profile_visibility: 'public' as const,
        email_notifications: true,
        marketing_emails: false,
        onboarding_completed: false
      }
      
      updateProfile(basicProfile)
    }
  }, [profile, profileLoading, user, updateProfile])

  const quickActions = [
    { icon: Code, label: 'New Project', href: '/projects/create', color: 'from-cyan-500 to-blue-500', description: 'Create a new project from scratch' },
    { icon: FileText, label: 'Templates', href: '/templates', color: 'from-purple-500 to-pink-500', description: 'Start with pre-built templates' },
    { icon: Folder, label: 'Import Code', href: '/import', color: 'from-green-500 to-emerald-500', description: 'Upload files or import from GitHub' },
    { icon: Play, label: 'Live Editor', href: '/editor', color: 'from-orange-500 to-red-500', description: 'Open the code editor directly' },
    // New quick access to My Projects
    { icon: Folder, label: 'My Projects', href: '/my-projects', color: 'from-indigo-500 to-cyan-500', description: 'View, filter, and sort all your projects' },
  ]


  // Helper function to format project status
  const getProjectStatus = (status: string) => {
    switch (status) {
      case 'published':
        return { class: 'bg-green-500/20 text-green-400', label: 'active' }
      case 'draft':
        return { class: 'bg-orange-500/20 text-orange-400', label: 'draft' }
      case 'archived':
        return { class: 'bg-gray-500/20 text-gray-400', label: 'archived' }
      default:
        return { class: 'bg-blue-500/20 text-blue-400', label: 'in-progress' }
    }
  }

  // Get display name from profile or auth metadata
  const displayName = profile?.full_name || user.user_metadata?.full_name || 'Developer'
  const firstName = displayName.split(' ')[0]

  // Check if email is verified
  const isEmailVerified = user.email_confirmed_at !== null
  const [showVerificationBanner, setShowVerificationBanner] = useState(false)

  useEffect(() => {
    // Check if banner was dismissed this session
    const dismissed = localStorage.getItem('email_verification_dismissed')
    setShowVerificationBanner(!isEmailVerified && !dismissed)
  }, [isEmailVerified])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-900 pt-16 sm:pt-18 lg:pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Email Verification Banner */}
        {showVerificationBanner && user.email && (
          <VerifyEmailBanner 
            email={user.email} 
            onDismiss={() => setShowVerificationBanner(false)}
          />
        )}

        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            {profile?.avatar_url && (
              <Image 
                src={profile.avatar_url} 
                alt="Profile" 
                width={64}
                height={64}
                className="w-16 h-16 rounded-full bg-white/10 border border-white/20"
              />
            )}
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Welcome back, {firstName}! 👋
              </h1>
              {profile?.username && (
                <p className="text-cyan-400 font-medium">@{profile.username}</p>
              )}
            </div>
          </div>
          <p className="text-slate-400">
            {profile?.bio || "Ready to build something amazing with AI-powered coding?"}
          </p>
          {profile?.skills && profile.skills.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {profile.skills.slice(0, 5).map((skill, index) => (
                <span 
                  key={index}
                  className="px-2 py-1 bg-white/10 border border-white/20 rounded-full text-xs text-white"
                >
                  {skill}
                </span>
              ))}
              {profile.skills.length > 5 && (
                <span className="px-2 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-slate-400">
                  +{profile.skills.length - 5} more
                </span>
              )}
            </div>
          )}
          
          {/* Profile Setup Prompt */}
          {!profileLoading && (!profile?.username || !profile?.bio || !profile?.skills?.length) && (
            <div className="mt-4 p-4 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-white mb-1">Complete Your Profile</h3>
                  <p className="text-sm text-slate-300">
                    Add your skills and bio to connect with the community
                  </p>
                </div>
                <Link 
                  href="/profile/setup"
                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-medium rounded-lg hover:from-cyan-600 hover:to-purple-600 transition-all text-sm"
                >
                  Complete Profile
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                <Code className="w-6 h-6 text-cyan-400" />
              </div>
              <span className="text-2xl">📈</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">
              {statsLoading ? '...' : stats?.projects_count || 0}
            </h3>
            <p className="text-slate-400 text-sm">Projects Created</p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <Heart className="w-6 h-6 text-purple-400" />
              </div>
              <span className="text-2xl">💜</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">
              {statsLoading ? '...' : stats?.total_likes_received || 0}
            </h3>
            <p className="text-slate-400 text-sm">Likes Received</p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                <Eye className="w-6 h-6 text-green-400" />
              </div>
              <span className="text-2xl">👀</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">
              {statsLoading ? '...' : stats?.total_views_received || 0}
            </h3>
            <p className="text-slate-400 text-sm">Project Views</p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-orange-400" />
              </div>
              <span className="text-2xl">👥</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">
              {statsLoading ? '...' : stats?.followers_count || 0}
            </h3>
            <p className="text-slate-400 text-sm">Followers</p>
          </div>

          {/* AI Usage Card */}
          <Link 
            href="/profile/usage"
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-200 transform hover:scale-[1.02] cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl">🤖</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">
              {aiUsage.loading ? '...' : `$${aiUsage.monthlyCost.toFixed(4)}`}
            </h3>
            <p className="text-slate-400 text-sm">AI Usage This Month</p>
            <p className="text-xs text-cyan-400 mt-2 group-hover:underline">
              View details →
            </p>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-4 mb-8">
              {quickActions.map((action, index) => (
                <Link
                  key={index}
                  href={action.href}
                  className="group bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-200 transform hover:scale-[1.02]"
                >
                  <div className={`w-12 h-12 bg-gradient-to-r ${action.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <action.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-white mb-1">{action.label}</h3>
                  <p className="text-slate-400 text-sm">{action.description}</p>
                </Link>
              ))}
              {/* Admin link loads conditionally to avoid SSR issues */}
              <AdminActionCard />
            </div>

            {/* Recent Projects */}
            <h2 className="text-xl font-semibold text-white mb-4">Recent Projects</h2>
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <div className="space-y-4">
                {projectsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto"></div>
                    <p className="text-slate-400 mt-2">Loading projects...</p>
                  </div>
                ) : projectsError || !projects ? (
                  <div className="text-center py-8">
                    <Code className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-slate-300 font-medium mb-2">No projects yet</h3>
                    <p className="text-slate-400 text-sm mb-4">
                      Create your first project to get started!
                    </p>
                    <Link 
                      href="/projects/create"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-medium rounded-lg hover:from-cyan-600 hover:to-purple-600 transition-all"
                    >
                      <Code className="w-4 h-4" />
                      Create Project
                    </Link>
                  </div>
                ) : projects && projects.data && projects.data.length > 0 ? (
                  projects.data.map((project) => {
                    const statusInfo = getProjectStatus(project.status)
                    return (
                      <div key={project.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg flex items-center justify-center">
                            <Code className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-medium text-white">{project.title}</h3>
                            <div className="text-sm text-slate-400 flex items-center gap-2">
                              <span>{project.language}</span>
                              <span>•</span>
                              <span>{formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}</span>
                              <span>•</span>
                              <span className={project.is_public ? 'text-green-400' : 'text-yellow-400'}>
                                {project.is_public ? 'public' : 'private'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.class}`}>
                            {statusInfo.label}
                          </span>
                          <Link 
                            href={`/editor?project=${project.id}`}
                            className="text-slate-400 hover:text-white transition-colors"
                          >
                            <Play className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="text-center py-8">
                    <Code className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-slate-300 font-medium mb-2">No projects yet</h3>
                    <p className="text-slate-400 text-sm mb-4">
                      Create your first project to get started!
                    </p>
                    <Link 
                      href="/projects/create"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-medium rounded-lg hover:from-cyan-600 hover:to-purple-600 transition-all"
                    >
                      <Code className="w-4 h-4" />
                      Create Project
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* AI Assistant Card */}
            <div className="bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Zap className="w-6 h-6 text-cyan-400" />
                <h3 className="font-semibold text-white">AI Assistant</h3>
              </div>
              <p className="text-slate-300 text-sm mb-4">
                Get intelligent code suggestions, bug fixes, and optimizations powered by AI.
              </p>
              <Link
                href="/projects/create"
                className="block w-full py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-medium rounded-lg hover:from-cyan-600 hover:to-purple-600 transition-all text-center"
              >
                Start Coding
              </Link>
            </div>

            {/* Tips Card */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h3 className="font-semibold text-white mb-4">💡 Pro Tip</h3>
              <p className="text-slate-300 text-sm mb-4">
                Use <kbd className="bg-white/10 px-2 py-1 rounded text-xs">Ctrl+Space</kbd> to trigger AI suggestions while coding.
              </p>
              <span className="text-slate-500 text-sm">View all shortcuts →</span>
            </div>

            {/* Activity Feed */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h3 className="font-semibold text-white mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {activityLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-400 mx-auto"></div>
                    <p className="text-slate-400 text-sm mt-2">Loading activity...</p>
                  </div>
                ) : activity && activity.length > 0 ? (
                  activity.slice(0, 3).map((item, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        item.activity_type === 'project_created' ? 'bg-green-400' :
                        item.activity_type === 'project_liked' ? 'bg-purple-400' :
                        item.activity_type === 'project_commented' ? 'bg-blue-400' :
                        item.activity_type === 'user_followed' ? 'bg-orange-400' :
                        item.activity_type === 'profile_updated' ? 'bg-cyan-400' :
                        'bg-gray-400'
                      }`}></div>
                      <div>
                        <p className="text-slate-300 text-sm">
                          {item.activity_type === 'project_created' && 'Created a new project'}
                          {item.activity_type === 'project_liked' && 'Liked a project'}
                          {item.activity_type === 'project_commented' && 'Commented on a project'}
                          {item.activity_type === 'user_followed' && 'Followed a user'}
                          {item.activity_type === 'profile_updated' && 'Updated profile'}
                        </p>
                        <p className="text-slate-500 text-xs">
                          {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <Activity className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-slate-400 text-sm">No recent activity</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function AdminActionCard() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)

  useEffect(() => {
    let mounted = true
    const check = async () => {
      try {
        const res = await fetch('/api/admin/whoami', { cache: 'no-store' })
        if (!res.ok) throw new Error('failed')
        const body = (await res.json()) as { isAdmin: boolean }
        if (mounted) setIsAdmin(body.isAdmin)
      } catch {
        if (mounted) setIsAdmin(false)
      }
    }
    check()
    return () => { mounted = false }
  }, [])

  if (isAdmin !== true) return null

  return (
    <Link
      href="/admin/moderation"
      className="group bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-200 transform hover:scale-[1.02]"
    >
      <div className="w-12 h-12 bg-gradient-to-r from-rose-500 to-orange-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
        <Shield className="w-6 h-6 text-white" />
      </div>
      <h3 className="font-semibold text-white mb-1">Admin Moderation</h3>
      <p className="text-slate-400 text-sm">Review reports and manage featured/published projects</p>
    </Link>
  )
}
