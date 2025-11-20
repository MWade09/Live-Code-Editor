'use client'

import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { 
  User as UserIcon,
  Bell,
  Shield,
  Palette,
  Key,
  Download,
  Trash2,
  Save,
  Github,
  Twitter,
  Globe as WebIcon,
  Settings as SettingsIcon,
  Linkedin,
  Rocket,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  ExternalLink
} from 'lucide-react'
import Link from 'next/link'
import AvatarUpload from '@/components/profile/avatar-upload'
import TagInput from '@/components/ui/tag-input'
import ChangePasswordModal from '@/components/profile/change-password-modal'
import DeleteAccountModal from '@/components/profile/delete-account-modal'

interface UserProfile {
  id: string
  username: string
  full_name: string | null
  bio: string | null
  avatar_url: string | null
  github_username: string | null
  twitter_handle: string | null
  website_url: string | null
  linkedin_url: string | null
  preferred_languages: string[]
  coding_experience: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  profile_visibility: 'public' | 'private' | 'friends'
  email_notifications: boolean
  marketing_emails: boolean
  location: string | null
  timezone: string | null
  company: string | null
  job_title: string | null
  skills: string[]
  interests: string[]
}

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false)
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false)
  
  // Deployment state
  const [netlifyToken, setNetlifyToken] = useState('')
  const [vercelToken, setVercelToken] = useState('')
  const [netlifyConnected, setNetlifyConnected] = useState(false)
  const [vercelConnected, setVercelConnected] = useState(false)
  const [showNetlifyToken, setShowNetlifyToken] = useState(false)
  const [showVercelToken, setShowVercelToken] = useState(false)
  const [savingDeployment, setSavingDeployment] = useState(false)
  
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        
        // Fetch profile data
        const { data: profileData, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (profileData && !error) {
          setProfile(profileData)
        }
        
        // Load deployment token status
        loadTokenStatus()
      }
      setLoading(false)
    }

    getUser()
  }, [supabase])

  // Handle URL fragment for direct tab navigation
  useEffect(() => {
    const hash = window.location.hash.slice(1) // Remove the #
    if (hash === 'deployment') {
      setActiveTab('deployment')
    }
  }, [])

  const handleSave = async () => {
    if (!user || !profile) return
    
    setSaving(true)
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          full_name: profile.full_name,
          bio: profile.bio,
          github_username: profile.github_username,
          twitter_handle: profile.twitter_handle,
          website_url: profile.website_url,
          linkedin_url: profile.linkedin_url,
          preferred_languages: profile.preferred_languages,
          coding_experience: profile.coding_experience,
          profile_visibility: profile.profile_visibility,
          email_notifications: profile.email_notifications,
          marketing_emails: profile.marketing_emails,
          location: profile.location,
          timezone: profile.timezone,
          company: profile.company,
          job_title: profile.job_title,
          skills: profile.skills,
          interests: profile.interests,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error

      setMessage({ type: 'success', text: 'Settings saved successfully!' })
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error('Error saving settings:', error)
      setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' })
      setTimeout(() => setMessage(null), 3000)
    }
    setSaving(false)
  }

  // Deployment functions
  const loadTokenStatus = async () => {
    try {
      const response = await fetch('/api/deployment/tokens')
      const data = await response.json()
      
      setNetlifyConnected(data.netlifyConnected || false)
      setVercelConnected(data.vercelConnected || false)
    } catch (error) {
      console.error('Failed to load token status:', error)
    }
  }

  const saveToken = async (platform: 'netlify' | 'vercel', token: string) => {
    if (!token.trim()) {
      setMessage({ type: 'error', text: 'Please enter a valid token' })
      return
    }

    setSavingDeployment(true)
    setMessage(null)

    try {
      const response = await fetch('/api/deployment/tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform,
          token,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save token')
      }

      setMessage({ 
        type: 'success', 
        text: `${platform === 'netlify' ? 'Netlify' : 'Vercel'} token saved successfully!` 
      })
      
      // Update connection status
      if (platform === 'netlify') {
        setNetlifyConnected(true)
        setNetlifyToken('')
      } else {
        setVercelConnected(true)
        setVercelToken('')
      }

      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to save token' 
      })
    } finally {
      setSavingDeployment(false)
    }
  }

  const removeToken = async (platform: 'netlify' | 'vercel') => {
    if (!confirm(`Are you sure you want to remove your ${platform === 'netlify' ? 'Netlify' : 'Vercel'} token?`)) {
      return
    }

    try {
      const response = await fetch(`/api/deployment/tokens?platform=${platform}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to remove token')
      }

      setMessage({ 
        type: 'success', 
        text: `${platform === 'netlify' ? 'Netlify' : 'Vercel'} token removed successfully` 
      })

      // Update connection status
      if (platform === 'netlify') {
        setNetlifyConnected(false)
      } else {
        setVercelConnected(false)
      }

      setTimeout(() => setMessage(null), 3000)
    } catch {
      setMessage({ 
        type: 'error', 
        text: 'Failed to remove token' 
      })
    }
  }

  const tabs = [
    { id: 'profile', name: 'Profile', icon: UserIcon },
    { id: 'privacy', name: 'Privacy', icon: Shield },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'appearance', name: 'Appearance', icon: Palette },
    { id: 'deployment', name: 'Deployment', icon: Rocket },
    { id: 'account', name: 'Account', icon: Key },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-900 pt-16 sm:pt-18 lg:pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto"></div>
            <p className="text-slate-400 mt-4">Loading settings...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-900 pt-16 sm:pt-18 lg:pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <SettingsIcon className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Authentication Required</h2>
            <p className="text-slate-400 mb-6">Please log in to access your settings.</p>
            <Link 
              href="/auth/login"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-medium rounded-lg hover:from-cyan-600 hover:to-purple-600 transition-all"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-900 pt-16 sm:pt-18 lg:pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-slate-400">Manage your account preferences and privacy settings</p>
        </div>

        {/* Success/Error Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl border ${
            message.type === 'success' 
              ? 'bg-green-500/10 border-green-500/20 text-green-400' 
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <nav className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span className="font-medium">{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-white mb-4">Profile Information</h2>
                  
                  {/* Avatar Section */}
                  <AvatarUpload
                    currentAvatarUrl={profile?.avatar_url}
                    userId={user.id}
                    onUploadComplete={(url) => setProfile(prev => prev ? { ...prev, avatar_url: url } : null)}
                  />

                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={profile?.full_name || ''}
                        onChange={(e) => setProfile(prev => prev ? { ...prev, full_name: e.target.value } : null)}
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Username
                      </label>
                      <input
                        type="text"
                        value={profile?.username || ''}
                        disabled
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-slate-400 cursor-not-allowed"
                      />
                      <p className="text-xs text-slate-500 mt-1">Username cannot be changed</p>
                    </div>
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Bio
                    </label>
                    <textarea
                      rows={3}
                      value={profile?.bio || ''}
                      onChange={(e) => setProfile(prev => prev ? { ...prev, bio: e.target.value } : null)}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      placeholder="Tell us about yourself..."
                    />
                  </div>

                  {/* Professional Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Company
                      </label>
                      <input
                        type="text"
                        value={profile?.company || ''}
                        onChange={(e) => setProfile(prev => prev ? { ...prev, company: e.target.value } : null)}
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        placeholder="Your company"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Job Title
                      </label>
                      <input
                        type="text"
                        value={profile?.job_title || ''}
                        onChange={(e) => setProfile(prev => prev ? { ...prev, job_title: e.target.value } : null)}
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        placeholder="Your job title"
                      />
                    </div>
                  </div>

                  {/* Location & Timezone */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Location
                      </label>
                      <input
                        type="text"
                        value={profile?.location || ''}
                        onChange={(e) => setProfile(prev => prev ? { ...prev, location: e.target.value } : null)}
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        placeholder="City, Country"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Timezone
                      </label>
                      <select
                        value={profile?.timezone || ''}
                        onChange={(e) => setProfile(prev => prev ? { ...prev, timezone: e.target.value } : null)}
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      >
                        <option value="">Select timezone</option>
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">Eastern Time</option>
                        <option value="America/Chicago">Central Time</option>
                        <option value="America/Denver">Mountain Time</option>
                        <option value="America/Los_Angeles">Pacific Time</option>
                        <option value="Europe/London">GMT</option>
                        <option value="Europe/Paris">Central European Time</option>
                        <option value="Asia/Tokyo">Japan Standard Time</option>
                      </select>
                    </div>
                  </div>

                  {/* Social Links */}
                  <div>
                    <h3 className="text-lg font-medium text-white mb-4">Social Links</h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Github className="w-5 h-5 text-slate-400" />
                        <input
                          type="text"
                          value={profile?.github_username || ''}
                          onChange={(e) => setProfile(prev => prev ? { ...prev, github_username: e.target.value } : null)}
                          className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                          placeholder="GitHub username"
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <Twitter className="w-5 h-5 text-slate-400" />
                        <input
                          type="text"
                          value={profile?.twitter_handle || ''}
                          onChange={(e) => setProfile(prev => prev ? { ...prev, twitter_handle: e.target.value } : null)}
                          className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                          placeholder="Twitter handle"
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <WebIcon className="w-5 h-5 text-slate-400" />
                        <input
                          type="url"
                          value={profile?.website_url || ''}
                          onChange={(e) => setProfile(prev => prev ? { ...prev, website_url: e.target.value } : null)}
                          className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                          placeholder="https://yourwebsite.com"
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <Linkedin className="w-5 h-5 text-slate-400" />
                        <input
                          type="url"
                          value={profile?.linkedin_url || ''}
                          onChange={(e) => setProfile(prev => prev ? { ...prev, linkedin_url: e.target.value } : null)}
                          className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                          placeholder="https://linkedin.com/in/yourprofile"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Coding Experience & Preferred Languages */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Coding Experience
                      </label>
                      <select
                        value={profile?.coding_experience || 'beginner'}
                        onChange={(e) => setProfile(prev => prev ? { ...prev, coding_experience: e.target.value as 'beginner' | 'intermediate' | 'advanced' | 'expert' } : null)}
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                        <option value="expert">Expert</option>
                      </select>
                    </div>
                  </div>

                  {/* Skills */}
                  <TagInput
                    tags={profile?.skills || []}
                    onChange={(skills) => setProfile(prev => prev ? { ...prev, skills } : null)}
                    label="Skills"
                    description="Add your technical skills (e.g., React, Python, Docker)"
                    placeholder="Add a skill..."
                    suggestions={[
                      'JavaScript', 'TypeScript', 'Python', 'React', 'Next.js', 'Node.js',
                      'Vue.js', 'Angular', 'HTML', 'CSS', 'Tailwind CSS', 'Bootstrap',
                      'Java', 'C++', 'C#', 'Go', 'Rust', 'PHP', 'Ruby', 'Swift', 'Kotlin',
                      'SQL', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis',
                      'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP',
                      'Git', 'CI/CD', 'Testing', 'Agile', 'UI/UX'
                    ]}
                    maxTags={15}
                  />

                  {/* Interests */}
                  <TagInput
                    tags={profile?.interests || []}
                    onChange={(interests) => setProfile(prev => prev ? { ...prev, interests } : null)}
                    label="Interests"
                    description="What areas of development interest you?"
                    placeholder="Add an interest..."
                    suggestions={[
                      'Web Development', 'Mobile Development', 'Game Development',
                      'Machine Learning', 'AI', 'Data Science', 'DevOps',
                      'Cloud Computing', 'Blockchain', 'Cybersecurity',
                      'UI/UX Design', 'Full Stack', 'Backend', 'Frontend',
                      'API Development', 'Microservices', 'System Design',
                      'Open Source', 'Teaching', 'Writing'
                    ]}
                    maxTags={10}
                  />

                  {/* Preferred Languages */}
                  <TagInput
                    tags={profile?.preferred_languages || []}
                    onChange={(preferred_languages) => setProfile(prev => prev ? { ...prev, preferred_languages } : null)}
                    label="Preferred Programming Languages"
                    description="Your favorite languages to code in"
                    placeholder="Add a language..."
                    suggestions={[
                      'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#',
                      'Go', 'Rust', 'PHP', 'Ruby', 'Swift', 'Kotlin', 'Dart',
                      'Scala', 'R', 'Perl', 'Haskell', 'Elixir', 'Clojure'
                    ]}
                    maxTags={5}
                  />
                </div>
              )}

              {/* Privacy Tab */}
              {activeTab === 'privacy' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-white mb-4">Privacy Settings</h2>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Profile Visibility
                    </label>
                    <select
                      value={profile?.profile_visibility || 'public'}
                      onChange={(e) => setProfile(prev => prev ? { ...prev, profile_visibility: e.target.value as 'public' | 'private' | 'friends' } : null)}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="public">Public - Anyone can see your profile</option>
                      <option value="friends">Friends Only - Only people you follow can see your profile</option>
                      <option value="private">Private - Only you can see your profile</option>
                    </select>
                  </div>

                  <div className="p-4 bg-white/5 rounded-xl">
                    <h3 className="font-medium text-white mb-2">Data & Privacy</h3>
                    <p className="text-sm text-slate-400 mb-4">
                      Control how your data is used and shared on the platform.
                    </p>
                    <div className="space-y-3">
                      <button 
                        onClick={() => {
                          // TODO: Implement data export
                          alert('Data export functionality coming soon!')
                        }}
                        className="flex items-center justify-between w-full p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                      >
                        <span className="text-white">Download your data</span>
                        <Download className="w-4 h-4 text-slate-400" />
                      </button>
                      <button 
                        onClick={() => setShowDeleteAccountModal(true)}
                        className="flex items-center justify-between w-full p-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                      >
                        <span>Delete your account</span>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-white mb-4">Notification Preferences</h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                      <div>
                        <h3 className="font-medium text-white">Email Notifications</h3>
                        <p className="text-sm text-slate-400">Receive notifications about your account activity</p>
                      </div>
                      <button
                        onClick={() => setProfile(prev => prev ? { ...prev, email_notifications: !prev.email_notifications } : null)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          profile?.email_notifications ? 'bg-cyan-500' : 'bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            profile?.email_notifications ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                      <div>
                        <h3 className="font-medium text-white">Marketing Emails</h3>
                        <p className="text-sm text-slate-400">Receive updates about new features and promotions</p>
                      </div>
                      <button
                        onClick={() => setProfile(prev => prev ? { ...prev, marketing_emails: !prev.marketing_emails } : null)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          profile?.marketing_emails ? 'bg-cyan-500' : 'bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            profile?.marketing_emails ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Appearance Tab */}
              {activeTab === 'appearance' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-white mb-4">Appearance</h2>
                  
                  <div className="p-4 bg-white/5 rounded-xl">
                    <h3 className="font-medium text-white mb-2">Theme</h3>
                    <p className="text-sm text-slate-400 mb-4">
                      Currently using dark theme. Light theme support coming soon!
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-slate-900 border-2 border-cyan-500 rounded-lg">
                        <div className="text-center">
                          <div className="w-full h-16 bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-900 rounded mb-2"></div>
                          <span className="text-xs text-white">Dark (Current)</span>
                        </div>
                      </div>
                      <div className="p-3 bg-gray-200 border-2 border-gray-300 rounded-lg opacity-50">
                        <div className="text-center">
                          <div className="w-full h-16 bg-gradient-to-br from-white to-gray-100 rounded mb-2"></div>
                          <span className="text-xs text-gray-600">Light (Soon)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Deployment Tab */}
              {activeTab === 'deployment' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-white mb-4">Deployment Settings</h2>
                  <p className="text-slate-400 mb-6">Configure your deployment platforms to enable one-click deployments from the editor.</p>
                  
                  {/* Netlify Section */}
                  <div className="bg-white/5 rounded-xl p-6">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-[#00C7B7] rounded-lg flex items-center justify-center">
                          <svg viewBox="0 0 24 24" fill="white" width="32" height="32">
                            <path d="M12 2L2 12l10 10 10-10L12 2zm0 2.8L19.2 12 12 19.2 4.8 12 12 4.8z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-white mb-1">Netlify</h3>
                          <div className="flex items-center gap-2">
                            {netlifyConnected ? (
                              <span className="flex items-center gap-1.5 text-sm text-green-400">
                                <CheckCircle className="w-4 h-4" />
                                Connected
                              </span>
                            ) : (
                              <span className="flex items-center gap-1.5 text-sm text-slate-400">
                                <XCircle className="w-4 h-4" />
                                Not connected
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {netlifyConnected && (
                        <button
                          onClick={() => removeToken('netlify')}
                          className="text-sm text-red-400 hover:text-red-300 transition-colors"
                        >
                          Remove Token
                        </button>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Personal Access Token
                        </label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                              type={showNetlifyToken ? 'text' : 'password'}
                              value={netlifyToken}
                              onChange={(e) => setNetlifyToken(e.target.value)}
                              placeholder="Enter your Netlify token"
                              className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-10 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                            />
                            <button
                              type="button"
                              onClick={() => setShowNetlifyToken(!showNetlifyToken)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                            >
                              {showNetlifyToken ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                          </div>
                          <button
                            onClick={() => saveToken('netlify', netlifyToken)}
                            disabled={savingDeployment || !netlifyToken.trim()}
                            className="flex items-center gap-2 px-6 py-2.5 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                          >
                            <Save className="w-4 h-4" />
                            Save
                          </button>
                        </div>
                      </div>

                      <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-white mb-2">How to get your Netlify token:</h4>
                        <ol className="text-sm text-slate-400 space-y-1 list-decimal list-inside">
                          <li>Go to your Netlify dashboard</li>
                          <li>Click on your profile → User settings → Applications</li>
                          <li>Create a new access token with deploy permissions</li>
                          <li>Copy and paste it above</li>
                        </ol>
                        <a
                          href="https://app.netlify.com/user/applications#personal-access-tokens"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 mt-3 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                        >
                          Get your token <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Vercel Section */}
                  <div className="bg-white/5 rounded-xl p-6">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-black rounded-lg flex items-center justify-center">
                          <svg viewBox="0 0 24 24" fill="white" width="32" height="32">
                            <path d="M12 2L2 19h20L12 2z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-white mb-1">Vercel</h3>
                          <div className="flex items-center gap-2">
                            {vercelConnected ? (
                              <span className="flex items-center gap-1.5 text-sm text-green-400">
                                <CheckCircle className="w-4 h-4" />
                                Connected
                              </span>
                            ) : (
                              <span className="flex items-center gap-1.5 text-sm text-slate-400">
                                <XCircle className="w-4 h-4" />
                                Not connected
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {vercelConnected && (
                        <button
                          onClick={() => removeToken('vercel')}
                          className="text-sm text-red-400 hover:text-red-300 transition-colors"
                        >
                          Remove Token
                        </button>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Access Token
                        </label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                              type={showVercelToken ? 'text' : 'password'}
                              value={vercelToken}
                              onChange={(e) => setVercelToken(e.target.value)}
                              placeholder="Enter your Vercel token"
                              className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-10 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                            />
                            <button
                              type="button"
                              onClick={() => setShowVercelToken(!showVercelToken)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                            >
                              {showVercelToken ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                          </div>
                          <button
                            onClick={() => saveToken('vercel', vercelToken)}
                            disabled={savingDeployment || !vercelToken.trim()}
                            className="flex items-center gap-2 px-6 py-2.5 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                          >
                            <Save className="w-4 h-4" />
                            Save
                          </button>
                        </div>
                      </div>

                      <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-white mb-2">How to get your Vercel token:</h4>
                        <ol className="text-sm text-slate-400 space-y-1 list-decimal list-inside">
                          <li>Go to your Vercel dashboard</li>
                          <li>Click on Settings → Tokens</li>
                          <li>Create a new token with appropriate scopes</li>
                          <li>Copy and paste it above</li>
                        </ol>
                        <a
                          href="https://vercel.com/account/tokens"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 mt-3 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                        >
                          Get your token <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Security Notice */}
                  <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
                    <div className="flex gap-3">
                      <Key className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-slate-300">
                        <p className="font-medium text-white mb-1">Security Notice</p>
                        <p>
                          Your tokens are stored securely in our database. We never share them with third parties.
                          You can remove them anytime from this page.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Account Tab */}
              {activeTab === 'account' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-white mb-4">Account Security</h2>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-white/5 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-white">Email</h3>
                        <span className="text-sm text-green-400">Verified</span>
                      </div>
                      <p className="text-sm text-slate-400">{user?.email}</p>
                    </div>

                    <div className="p-4 bg-white/5 rounded-xl">
                      <h3 className="font-medium text-white mb-2">Password</h3>
                      <p className="text-sm text-slate-400 mb-3">Last updated: Never</p>
                      <button 
                        onClick={() => setShowChangePasswordModal(true)}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-colors"
                      >
                        Change Password
                      </button>
                    </div>

                    <div className="p-4 bg-white/5 rounded-xl">
                      <h3 className="font-medium text-white mb-2">Two-Factor Authentication</h3>
                      <p className="text-sm text-slate-400 mb-3">Add an extra layer of security to your account</p>
                      <button className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 text-sm rounded-lg transition-colors">
                        Enable 2FA (Coming Soon)
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Save Button */}
              <div className="flex justify-end pt-6 border-t border-white/10">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-medium rounded-lg hover:from-cyan-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modals */}
        <ChangePasswordModal
          isOpen={showChangePasswordModal}
          onClose={() => setShowChangePasswordModal(false)}
        />
        <DeleteAccountModal
          isOpen={showDeleteAccountModal}
          onClose={() => setShowDeleteAccountModal(false)}
          userEmail={user?.email || ''}
        />
      </div>
    </div>
  )
}