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
  Settings as SettingsIcon
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

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
      }
      setLoading(false)
    }

    getUser()
  }, [supabase])

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

  const tabs = [
    { id: 'profile', name: 'Profile', icon: UserIcon },
    { id: 'privacy', name: 'Privacy', icon: Shield },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'appearance', name: 'Appearance', icon: Palette },
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
                  <div className="flex items-center gap-6">
                    {profile?.avatar_url ? (
                      <Image 
                        src={profile.avatar_url} 
                        alt="Profile" 
                        width={80}
                        height={80}
                        className="w-20 h-20 rounded-full bg-white/10 border border-white/20"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full flex items-center justify-center">
                        <UserIcon className="w-8 h-8 text-white" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-medium text-white">Profile Picture</h3>
                      <p className="text-sm text-slate-400">Update your avatar</p>
                      <button className="mt-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-colors">
                        Change Avatar
                      </button>
                    </div>
                  </div>

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
                    </div>
                  </div>
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
                      <button className="flex items-center justify-between w-full p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
                        <span className="text-white">Download your data</span>
                        <Download className="w-4 h-4 text-slate-400" />
                      </button>
                      <button className="flex items-center justify-between w-full p-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors">
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
                      <button className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-colors">
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
      </div>
    </div>
  )
}