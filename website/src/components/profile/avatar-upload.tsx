'use client'

import { useState, useRef } from 'react'
import { Upload, X, Loader2, Camera } from 'lucide-react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

interface AvatarUploadProps {
  currentAvatarUrl?: string | null
  userId: string
  onUploadComplete: (url: string) => void
}

export default function AvatarUpload({ currentAvatarUrl, userId, onUploadComplete }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB')
      return
    }

    setError(null)
    setPreviewUrl(URL.createObjectURL(file))
    
    // Upload to Supabase
    await uploadAvatar(file)
  }

  const uploadAvatar = async (file: File) => {
    setUploading(true)
    try {
      // Create unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('user-uploads')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        throw uploadError
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('user-uploads')
        .getPublicUrl(filePath)

      const publicUrl = urlData.publicUrl

      // Update user profile
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ 
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (updateError) {
        throw updateError
      }

      // Delete old avatar if exists
      if (currentAvatarUrl && currentAvatarUrl.includes('user-uploads')) {
        const oldPath = currentAvatarUrl.split('/user-uploads/').pop()
        if (oldPath) {
          await supabase.storage
            .from('user-uploads')
            .remove([oldPath])
        }
      }

      onUploadComplete(publicUrl)
      setPreviewUrl(null)
    } catch (err) {
      console.error('Error uploading avatar:', err)
      setError('Failed to upload avatar. Please try again.')
      setPreviewUrl(null)
    } finally {
      setUploading(false)
    }
  }

  const removeAvatar = async () => {
    setUploading(true)
    try {
      // Delete from storage
      if (currentAvatarUrl && currentAvatarUrl.includes('user-uploads')) {
        const filePath = currentAvatarUrl.split('/user-uploads/').pop()
        if (filePath) {
          await supabase.storage
            .from('user-uploads')
            .remove([filePath])
        }
      }

      // Update profile
      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          avatar_url: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) throw error

      onUploadComplete('')
      setPreviewUrl(null)
    } catch (err) {
      console.error('Error removing avatar:', err)
      setError('Failed to remove avatar. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-6">
        {/* Avatar Preview */}
        <div className="relative">
          {previewUrl || currentAvatarUrl ? (
            <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-white/20">
              <Image 
                src={previewUrl || currentAvatarUrl || ''} 
                alt="Avatar" 
                width={96}
                height={96}
                className="w-full h-full object-cover"
              />
              {uploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
              )}
            </div>
          ) : (
            <div className="w-24 h-24 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full flex items-center justify-center">
              <Camera className="w-10 h-10 text-white" />
            </div>
          )}
        </div>

        {/* Upload Controls */}
        <div className="flex-1">
          <h3 className="font-medium text-white mb-1">Profile Picture</h3>
          <p className="text-sm text-slate-400 mb-3">
            Upload a photo or choose from your files (max 5MB)
          </p>
          
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                console.log('Avatar button clicked', fileInputRef.current)
                fileInputRef.current?.click()
              }}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Change Avatar
                </>
              )}
            </button>

            {currentAvatarUrl && !uploading && (
              <button
                type="button"
                onClick={removeAvatar}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
                Remove
              </button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Upload Tips */}
      <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
        <p className="text-sm text-cyan-400">
          <strong>Tip:</strong> Use a square image (1:1 ratio) for best results. Supported formats: JPG, PNG, GIF, WebP
        </p>
      </div>
    </div>
  )
}
