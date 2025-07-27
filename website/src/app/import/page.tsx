'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { 
  Upload, 
  FileText, 
  Github,
  Code,
  X,
  Check,
  AlertCircle,
  ExternalLink,
  Archive,
  Plus
} from 'lucide-react'
import Link from 'next/link'

interface ImportedFile {
  name: string
  content: string
  type: string
  size: number
}

interface GitHubRepo {
  id: number
  name: string
  description: string
  language: string
  updated_at: string
  html_url: string
}

export default function ImportPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'files' | 'github'>('files')
  
  // File import state
  const [dragOver, setDragOver] = useState(false)
  const [importedFiles, setImportedFiles] = useState<ImportedFile[]>([])
  const [processing, setProcessing] = useState(false)
  
  // GitHub import state
  const [githubUsername, setGithubUsername] = useState('')
  const [githubRepos, setGithubRepos] = useState<GitHubRepo[]>([])
  const [githubLoading, setGithubLoading] = useState(false)
  
  // Project creation state
  const [creating, setCreating] = useState(false)
  const [projectTitle, setProjectTitle] = useState('')
  const [projectDescription, setProjectDescription] = useState('')

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login?redirect=/import')
        return
      }
      setUser(user)
      setLoading(false)
    }
    getUser()
  }, [supabase, router])

  // File handling functions
  const processFiles = useCallback(async (files: File[]) => {
    setProcessing(true)
    const processed: ImportedFile[] = []

    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        continue
      }

      const content = await readFileContent(file)
      processed.push({
        name: file.name,
        content,
        type: file.type || getFileType(file.name),
        size: file.size
      })
    }

    setImportedFiles(prev => [...prev, ...processed])
    setProcessing(false)

    // Auto-generate project title from first file
    if (processed.length > 0 && !projectTitle) {
      const firstFile = processed[0]
      const nameWithoutExt = firstFile.name.replace(/\.[^/.]+$/, '')
      setProjectTitle(nameWithoutExt.charAt(0).toUpperCase() + nameWithoutExt.slice(1))
    }
  }, [projectTitle])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    processFiles(files)
  }, [processFiles])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    processFiles(files)
  }

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string || '')
      reader.readAsText(file)
    })
  }

  const getFileType = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase()
    const typeMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'json': 'json',
      'md': 'markdown',
      'txt': 'text'
    }
    return typeMap[ext || ''] || 'text'
  }

  const removeFile = (index: number) => {
    setImportedFiles(prev => prev.filter((_, i) => i !== index))
  }

  // GitHub functions
  const searchGitHubRepos = async () => {
    if (!githubUsername.trim()) return

    setGithubLoading(true)
    try {
      const response = await fetch(`https://api.github.com/users/${githubUsername}/repos?sort=updated&per_page=20`)
      const repos = await response.json()
      
      if (Array.isArray(repos)) {
        setGithubRepos(repos)
      } else {
        setGithubRepos([])
      }
    } catch (error) {
      console.error('Error fetching GitHub repos:', error)
      setGithubRepos([])
    }
    setGithubLoading(false)
  }

  const importFromGitHub = async (repo: GitHubRepo) => {
    if (!user) return

    setCreating(true)
    try {
      // For demo purposes, we'll create a project with the repo info
      // In a real implementation, you'd fetch the actual repo contents
      const { error } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          title: repo.name,
          description: repo.description || `Imported from GitHub: ${repo.name}`,
          content: `# ${repo.name}\n\n${repo.description || 'No description available'}\n\n**Language:** ${repo.language}\n**GitHub:** ${repo.html_url}\n\n*This is a placeholder. In a full implementation, the actual repository contents would be imported here.*`,
          language: repo.language || 'Unknown',
          framework: '',
          tags: ['github-import', repo.language?.toLowerCase() || 'unknown'],
          github_url: repo.html_url,
          is_public: false,
          status: 'published'
        })

      if (error) throw error

      router.push('/projects')
    } catch (error) {
      console.error('Error importing from GitHub:', error)
    }
    setCreating(false)
  }

  // Project creation
  const createProjectFromFiles = async () => {
    if (!user || importedFiles.length === 0 || !projectTitle.trim()) return

    setCreating(true)
    try {
      // Combine all files into a single content string
      const combinedContent = importedFiles.map(file => 
        `// File: ${file.name}\n${file.content}\n\n`
      ).join('')

      // Determine primary language from files
      const languages = importedFiles.map(f => f.type).filter(Boolean)
      const primaryLanguage = languages.length > 0 ? languages[0] : 'Unknown'

      const { error } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          title: projectTitle.trim(),
          description: projectDescription.trim() || `Imported project with ${importedFiles.length} files`,
          content: combinedContent,
          language: primaryLanguage,
          framework: '',
          tags: ['imported', ...Array.from(new Set(languages))],
          is_public: false,
          status: 'published'
        })

      if (error) throw error

      router.push('/projects')
    } catch (error) {
      console.error('Error creating project:', error)
    }
    setCreating(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-900 pt-16 sm:pt-18 lg:pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto"></div>
            <p className="text-slate-400 mt-4">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-900 pt-16 sm:pt-18 lg:pt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/20">
                <Upload className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-cyan-200 to-purple-200 bg-clip-text text-transparent">
                  Import Code
                </h1>
                <p className="text-slate-400 mt-1">
                  Import your existing code from files or GitHub repositories
                </p>
              </div>
            </div>
            <Link 
              href="/dashboard"
              className="text-slate-400 hover:text-white transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700 mb-8">
          <button
            onClick={() => setActiveTab('files')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'files'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-5 h-5 inline mr-2" />
            Upload Files
          </button>
          <button
            onClick={() => setActiveTab('github')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'github'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Github className="w-5 h-5 inline mr-2" />
            GitHub Import
          </button>
        </div>

        {/* Files Tab */}
        {activeTab === 'files' && (
          <div className="space-y-8">
            {/* File Upload Area */}
            <div
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
                dragOver 
                  ? 'border-cyan-400 bg-cyan-500/10' 
                  : 'border-slate-600 hover:border-slate-500'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Drop your files here
              </h3>
              <p className="text-slate-400 mb-6">
                Or click to browse and select files (Max 10MB per file)
              </p>
              <input
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
                accept=".js,.jsx,.ts,.tsx,.py,.html,.css,.scss,.json,.md,.txt"
              />
              <label
                htmlFor="file-upload"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-cyan-600 to-purple-600 text-white font-medium rounded-lg hover:from-cyan-500 hover:to-purple-500 transition-all cursor-pointer"
              >
                <Plus className="w-5 h-5 mr-2" />
                Choose Files
              </label>
            </div>

            {/* Processing */}
            {processing && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto"></div>
                <p className="text-slate-400 mt-2">Processing files...</p>
              </div>
            )}

            {/* Imported Files */}
            {importedFiles.length > 0 && (
              <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <Archive className="w-5 h-5 text-cyan-400 mr-2" />
                  Imported Files ({importedFiles.length})
                </h3>
                
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {importedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-slate-400" />
                        <div>
                          <p className="text-white font-medium">{file.name}</p>
                          <p className="text-slate-400 text-sm">
                            {file.type} • {(file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFile(index)}
                        className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Project Details */}
            {importedFiles.length > 0 && (
              <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
                <h3 className="text-xl font-semibold text-white mb-4">Project Details</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Project Title *
                    </label>
                    <input
                      type="text"
                      value={projectTitle}
                      onChange={(e) => setProjectTitle(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                      placeholder="Enter project title"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={projectDescription}
                      onChange={(e) => setProjectDescription(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors resize-none"
                      placeholder="Describe your imported project..."
                    />
                  </div>
                  
                  <button
                    onClick={createProjectFromFiles}
                    disabled={creating || !projectTitle.trim()}
                    className="w-full bg-gradient-to-r from-cyan-600 to-purple-600 text-white py-3 px-6 rounded-lg hover:from-cyan-500 hover:to-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {creating ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Creating Project...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-5 h-5" />
                        <span>Create Project</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* GitHub Tab */}
        {activeTab === 'github' && (
          <div className="space-y-8">
            {/* GitHub Search */}
            <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Github className="w-5 h-5 text-cyan-400 mr-2" />
                Import from GitHub
              </h3>
              
              <div className="flex space-x-4">
                <input
                  type="text"
                  value={githubUsername}
                  onChange={(e) => setGithubUsername(e.target.value)}
                  placeholder="Enter GitHub username"
                  className="flex-1 px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                  onKeyPress={(e) => e.key === 'Enter' && searchGitHubRepos()}
                />
                <button
                  onClick={searchGitHubRepos}
                  disabled={githubLoading || !githubUsername.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-purple-600 text-white font-medium rounded-lg hover:from-cyan-500 hover:to-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {githubLoading ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>

            {/* GitHub Repositories */}
            {githubRepos.length > 0 && (
              <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
                <h3 className="text-xl font-semibold text-white mb-4">
                  Repositories ({githubRepos.length})
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {githubRepos.map((repo) => (
                    <div
                      key={repo.id}
                      className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:bg-slate-700/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-white mb-1">{repo.name}</h4>
                          <p className="text-slate-400 text-sm line-clamp-2">
                            {repo.description || 'No description available'}
                          </p>
                        </div>
                        <a
                          href={repo.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-400 hover:text-white transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm text-slate-400">
                          {repo.language && (
                            <span className="flex items-center">
                              <Code className="w-4 h-4 mr-1" />
                              {repo.language}
                            </span>
                          )}
                          <span>
                            Updated {new Date(repo.updated_at).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <button
                          onClick={() => importFromGitHub(repo)}
                          disabled={creating}
                          className="px-3 py-1 bg-gradient-to-r from-cyan-600 to-purple-600 text-white text-sm font-medium rounded hover:from-cyan-500 hover:to-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {creating ? 'Importing...' : 'Import'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {githubUsername && githubRepos.length === 0 && !githubLoading && (
              <div className="text-center py-12">
                <AlertCircle className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-300 mb-2">No repositories found</h3>
                <p className="text-slate-400">
                  No public repositories found for user &quot;{githubUsername}&quot;
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
