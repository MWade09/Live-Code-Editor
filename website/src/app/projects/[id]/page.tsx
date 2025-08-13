'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ProjectWithDetails } from '@/types'
import { User } from '@supabase/supabase-js'
import { 
  ArrowLeft,
  Heart,
  Eye,
  Clock,
  Calendar,
  Github,
  ExternalLink,
  Share2,
  Copy,
  MessageCircle,
  Flag,
  Edit,
  Trash2,
  Send,
  History,
  GitCommit
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

export default function ProjectDetailPage() {
  const [project, setProject] = useState<ProjectWithDetails | null>(null)
  const [isLiked, setIsLiked] = useState(false)
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [copying, setCopying] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [saves, setSaves] = useState<Array<{ id: string; created_at: string; change_summary: string | null }>>([])
  const [commits, setCommits] = useState<Array<{ id: string; message: string; created_at: string; branch?: string }>>([])
  const [commitTotal, setCommitTotal] = useState<number>(0)
  const [commitPage, setCommitPage] = useState<number>(1)
  const commitPageSize = 15
  const [selectedBranch, setSelectedBranch] = useState<string>('')
  const [branches, setBranches] = useState<Array<{ id: string; name: string }>>([])
  const [newBranchName, setNewBranchName] = useState<string>('')
  const [compareA, setCompareA] = useState<string>('main')
  const [compareB, setCompareB] = useState<string>('')
  const [compareLoading, setCompareLoading] = useState<boolean>(false)
  const [compareRows, setCompareRows] = useState<Array<{ t: 'ctx' | 'add' | 'rem'; v: string; ln?: number }>>([])
  const [toasts, setToasts] = useState<Array<{ id: string; text: string; type: 'success' | 'error' | 'info' }>>([])
  const [renameBranchValue, setRenameBranchValue] = useState<string>('')
  const [commitContent, setCommitContent] = useState<string>('')
  const [viewingCommitId, setViewingCommitId] = useState<string | null>(null)
  
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const searchParams = useSearchParams()

  const fetchProject = async () => {
    try {
      // Resolve current user first to determine view permissions
      const { data: authData } = await supabase.auth.getUser()
      const authedUser = authData?.user || null
      setCurrentUser(authedUser)

      // Fetch project (public or private). We'll enforce access below.
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          user_profiles!inner(id, username, full_name, avatar_url),
          project_likes(count),
          project_views(count)
        `)
        .eq('id', params.id)
        .single()

      if (error) throw error

      const transformedProject: ProjectWithDetails = {
        ...data,
        user_profiles: data.user_profiles,
        total_likes: Array.isArray(data.project_likes) ? data.project_likes.length : 0,
        total_views: Array.isArray(data.project_views) ? data.project_views.length : 0,
        total_comments: 0, // Will be implemented later
        is_liked: false
      }

      // Enforce access: allow public or owner of private projects
      const isOwner = authedUser && transformedProject.user_id === authedUser.id
      if (!transformedProject.is_public && !isOwner) {
        router.push('/dashboard')
        return
      }

      setProject(transformedProject)
      
      // Check if current user liked this project
      if (authedUser) {
        const { data: like } = await supabase
          .from('project_likes')
          .select('id')
          .eq('project_id', params.id)
          .eq('user_id', authedUser.id)
          .single()
        
        setIsLiked(!!like)
      }
    } catch (error: unknown) {
      console.error('Error fetching project:', error)
      router.push('/404')
    }
    setLoading(false)
  }

  const incrementViewCount = async () => {
    if (!currentUser) return
    
    try {
      // Check if user has already viewed this project
      const { data: existingView } = await supabase
        .from('project_views')
        .select('id')
        .eq('project_id', params.id)
        .eq('user_id', currentUser.id)
        .single()

      if (!existingView) {
        await supabase
          .from('project_views')
          .insert({
            project_id: params.id as string,
            user_id: currentUser.id
          })
      }
    } catch (error) {
      console.error('Error incrementing view count:', error)
    }
  }

  useEffect(() => {
    if (params.id) {
      fetchProject()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  useEffect(() => {
    if (currentUser && params.id) {
      incrementViewCount()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, params.id])

  const handleLike = async () => {
    if (!currentUser) {
      router.push('/auth/login')
      return
    }

    try {
      if (isLiked) {
        // Unlike
        await supabase
          .from('project_likes')
          .delete()
          .eq('project_id', params.id)
          .eq('user_id', currentUser.id)
        
        setIsLiked(false)
        if (project) {
          setProject({
            ...project,
            total_likes: project.total_likes - 1
          })
        }
      } else {
        // Like
        await supabase
          .from('project_likes')
          .insert({
            project_id: params.id as string,
            user_id: currentUser.id
          })
        
        setIsLiked(true)
        if (project) {
          setProject({
            ...project,
            total_likes: project.total_likes + 1
          })
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error)
    }
  }

  const copyCode = async () => {
    if (!project?.content) return
    
    setCopying(true)
    try {
      await navigator.clipboard.writeText(project.content as string)
      setTimeout(() => setCopying(false), 2000)
    } catch (error) {
      console.error('Error copying code:', error)
      setCopying(false)
    }
  }

  const shareProject = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: project?.title,
          text: project?.description || 'Check out this awesome project!',
          url: window.location.href
        })
      } catch (error) {
        console.error('Error sharing:', error)
      }
    } else {
      // Fallback: copy URL to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href)
        notify('Link copied', 'success')
      } catch (error) {
        console.error('Error copying URL:', error)
      }
    }
  }

  const togglePublish = async () => {
    if (!project || !isOwner) return
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData?.session?.access_token
      const res = await fetch(`/api/projects/${project.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ is_public: !project.is_public })
      })
      if (!res.ok) throw new Error('Failed to update publish status')
      setProject({ ...project, is_public: !project.is_public })
    } catch (error) {
      console.error('Error toggling publish:', error)
      notify('Failed to change publish status', 'error')
    }
  }

  // Comments (basic UI)
  const [newComment, setNewComment] = useState('')
  const [posting, setPosting] = useState(false)
  const [comments, setComments] = useState<Array<{ id: string; content: string; created_at: string; user_profiles: { username: string } }>>([])

  const fetchComments = async () => {
    if (!project) return
    const { data, error } = await supabase
      .from('comments')
      .select('id, content, created_at, user_profiles!inner(username)')
      .eq('project_id', project.id)
      .order('created_at', { ascending: false })
      .limit(50)
    if (!error && data) {
      const rows = data as unknown as Array<{
        id: unknown
        content: unknown
        created_at: unknown
        user_profiles: unknown
      }>
      const toStringVal = (v: unknown): string => (typeof v === 'string' ? v : v == null ? '' : String(v))
      const normalized = rows.map((row) => {
        let username = ''
        if (Array.isArray(row.user_profiles)) {
          const first = row.user_profiles[0] as Record<string, unknown> | undefined
          username = toStringVal(first?.username)
        } else if (row.user_profiles && typeof row.user_profiles === 'object') {
          const up = row.user_profiles as Record<string, unknown>
          username = toStringVal(up.username)
        }
        return {
          id: toStringVal(row.id),
          content: toStringVal(row.content),
          created_at: toStringVal(row.created_at),
          user_profiles: { username },
        }
      })
      setComments(normalized)
    }
  }

  useEffect(() => {
    fetchComments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id])

  useEffect(() => {
    const loadSaves = async () => {
      if (!project) return
      try {
        const res = await fetch(`/api/projects/${project.id}/saves`, { cache: 'no-store' })
        if (!res.ok) return
        const body = await res.json()
        setSaves((body?.data || []) as Array<{ id: string; created_at: string; change_summary: string | null }>)
      } catch {}
    }
    loadSaves()
  }, [project?.id])

  const isOwner = !!(currentUser && project && project.user_id === currentUser.id)

  // Load branches (owner only)
  useEffect(() => {
    const loadBranches = async () => {
      if (!project || !isOwner) return
      try {
        const { data: sessionData } = await supabase.auth.getSession()
        const token = sessionData?.session?.access_token
        const res = await fetch(`/api/projects/${project.id}/branches`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }, cache: 'no-store' })
        if (!res.ok) return
        const body = await res.json()
        const rows = Array.isArray(body?.data) ? body.data : []
        setBranches(rows as Array<{ id: string; name: string }>)
      } catch {}
    }
    loadBranches()
  }, [project?.id, isOwner, supabase])

  // Load commits with pagination and branch filter (owner only)
  useEffect(() => {
    const loadCommits = async () => {
      if (!project || !isOwner) return
      try {
        const { data: sessionData } = await supabase.auth.getSession()
        const token = sessionData?.session?.access_token
        const url = new URL(window.location.origin + `/api/projects/${project.id}/commits`)
        if (selectedBranch) url.searchParams.set('branch', selectedBranch)
        url.searchParams.set('page', String(commitPage))
        url.searchParams.set('pageSize', String(commitPageSize))
        const res = await fetch(url.toString(), { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }, cache: 'no-store' })
        if (!res.ok) return
        const body = await res.json()
        const rows = Array.isArray(body?.data) ? body.data : []
        setCommits(rows as Array<{ id: string; message: string; created_at: string; branch?: string }>)
        setCommitTotal(typeof body?.total === 'number' ? body.total : rows.length)
      } catch {}
    }
    loadCommits()
  }, [project?.id, isOwner, selectedBranch, commitPage, commitPageSize, supabase])

  const viewCommit = async (commitId: string) => {
    if (!project) return
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData?.session?.access_token
      const res = await fetch(`/api/projects/${project.id}/commits/${commitId}`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      })
      if (!res.ok) return
      const body = await res.json()
      setViewingCommitId(commitId)
      setCommitContent(String(body?.data?.content || ''))
    } catch {}
  }

  const createBranch = async () => {
    if (!project || !isOwner || !newBranchName.trim()) return
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData?.session?.access_token
      const res = await fetch(`/api/projects/${project.id}/branches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ name: newBranchName.trim() })
      })
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(text || 'Failed to create branch')
      }
      setNewBranchName('')
      // refresh branches
      const refreshed = await fetch(`/api/projects/${project.id}/branches`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }, cache: 'no-store' })
      if (refreshed.ok) {
        const body = await refreshed.json()
        setBranches((Array.isArray(body?.data) ? body.data : []) as Array<{ id: string; name: string }>)
      }
    } catch (e) {
      console.error('Create branch failed', e)
      notify('Failed to create branch', 'error')
    }
  }

  const restoreCommit = async (commitId: string) => {
    if (!project || !currentUser || currentUser.id !== project.user_id) return
    if (!window.confirm('Restore to this commit? This will overwrite the current content.')) return
    // Fetch commit content and update project via PUT
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData?.session?.access_token
      const res = await fetch(`/api/projects/${project.id}/commits/${commitId}`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      })
      if (!res.ok) return
      const body = await res.json()
      const content = String(body?.data?.content || '')
      const put = await fetch(`/api/projects/${project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ content })
      })
      if (!put.ok) throw new Error('Failed to restore')
      // Optionally create a revert commit
      await fetch(`/api/projects/${project.id}/commits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ message: `Restore to ${commitId.slice(0,7)}`, content })
      }).catch(() => {})
      // Refresh data
      fetchProject()
      setViewingCommitId(null)
    } catch (e) {
      console.error('Restore failed', e)
      notify('Failed to restore commit', 'error')
    }
  }

  const fetchLatestCommitForBranch = async (branchName: string) => {
    if (!project || !isOwner) return null
    const { data: sessionData } = await supabase.auth.getSession()
    const token = sessionData?.session?.access_token
    const url = new URL(window.location.origin + `/api/projects/${project.id}/commits`)
    url.searchParams.set('branch', branchName)
    url.searchParams.set('page', '1')
    url.searchParams.set('pageSize', '1')
    const res = await fetch(url.toString(), { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }, cache: 'no-store' })
    if (!res.ok) return null
    const body = await res.json()
    const rows = Array.isArray(body?.data) ? body.data : []
    return rows[0] as { id: string; message: string; created_at: string; branch?: string } | null
  }

  const fetchCommitContent = async (commitId: string) => {
    if (!project || !isOwner) return ''
    const { data: sessionData } = await supabase.auth.getSession()
    const token = sessionData?.session?.access_token
    const res = await fetch(`/api/projects/${project.id}/commits/${commitId}`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } })
    if (!res.ok) return ''
    const body = await res.json()
    return String(body?.data?.content || '')
  }

  const computeLineDiff = (oldText: string, newText: string) => {
    const oldLines = String(oldText || '').split('\n')
    const newLines = String(newText || '').split('\n')
    const max = Math.max(oldLines.length, newLines.length)
    const rows: Array<{ t: 'ctx' | 'add' | 'rem'; v: string; ln?: number }> = []
    for (let i = 0; i < max; i += 1) {
      const a = oldLines[i] ?? ''
      const b = newLines[i] ?? ''
      if (a === b) rows.push({ t: 'ctx', v: a, ln: i + 1 })
      else {
        if (a) rows.push({ t: 'rem', v: a, ln: i + 1 })
        if (b) rows.push({ t: 'add', v: b, ln: i + 1 })
      }
    }
    return rows
  }

  // Create a combined view that pairs removed+added into a single change for inline rendering
  const toInlineRenderable = (rows: Array<{ t: 'ctx' | 'add' | 'rem'; v: string; ln?: number }>) => {
    const items: Array<{ kind: 'ctx' | 'add' | 'rem' | 'change'; a?: { v: string; ln?: number }; b?: { v: string; ln?: number } }> = []
    for (let i = 0; i < rows.length; i += 1) {
      const r = rows[i]
      if (r.t === 'rem' && i + 1 < rows.length && rows[i + 1].t === 'add') {
        items.push({ kind: 'change', a: { v: r.v, ln: r.ln }, b: { v: rows[i + 1].v, ln: rows[i + 1].ln } })
        i += 1
        continue
      }
      if (r.t === 'ctx') items.push({ kind: 'ctx', a: { v: r.v, ln: r.ln } })
      else if (r.t === 'add') items.push({ kind: 'add', b: { v: r.v, ln: r.ln } })
      else if (r.t === 'rem') items.push({ kind: 'rem', a: { v: r.v, ln: r.ln } })
    }
    return items
  }

  // Compute simple inline character diff using common prefix/suffix
  const inlineDiffSegments = (a: string, b: string) => {
    let i = 0
    const aLen = a.length
    const bLen = b.length
    const maxPrefix = Math.min(aLen, bLen)
    while (i < maxPrefix && a[i] === b[i]) i += 1
    let j = 0
    const maxSuffix = Math.min(aLen - i, bLen - i)
    while (j < maxSuffix && a[aLen - 1 - j] === b[bLen - 1 - j]) j += 1
    const prefix = a.slice(0, i)
    const aMid = a.slice(i, aLen - j)
    const bMid = b.slice(i, bLen - j)
    const suffix = a.slice(aLen - j)
    return { prefix, aMid, bMid, suffix }
  }

  const handleCompareBranches = async () => {
    if (!project || !isOwner) return
    if (!compareA || !compareB) { alert('Select two branches'); return }
    setCompareLoading(true)
    try {
      const aHead = await fetchLatestCommitForBranch(compareA)
      const bHead = await fetchLatestCommitForBranch(compareB)
      if (!aHead || !bHead) {
        setCompareRows([])
      } else {
        const aContent = await fetchCommitContent(aHead.id)
        const bContent = await fetchCommitContent(bHead.id)
        setCompareRows(computeLineDiff(aContent, bContent))
      }
    } finally {
      setCompareLoading(false)
    }
  }

  const handleMergeAdopt = async () => {
    if (!project || !isOwner) return
    if (!compareA || !compareB || compareA === compareB) { alert('Select different branches'); return }
    if (!window.confirm(`Merge (adopt) ${compareA} into ${compareB}? This overwrites current content.`)) return
    try {
      const aHead = await fetchLatestCommitForBranch(compareA)
      if (!aHead) { alert('No source commit'); return }
      const content = await fetchCommitContent(aHead.id)
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData?.session?.access_token
      const put = await fetch(`/api/projects/${project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ content })
      })
      if (!put.ok) throw new Error('Failed to update project content')
      await fetch(`/api/projects/${project.id}/commits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ message: `Merge ${compareA} -> ${compareB}: ${aHead.message || ''}`.slice(0, 120), content, branch: compareB })
      })
      setSelectedBranch(compareB)
      setCommitPage(1)
      notify('Merge completed', 'success')
    } catch (e) {
      console.error(e)
      notify('Merge failed', 'error')
    }
  }

  const notify = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    setToasts(prev => [...prev, { id, text, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3200)
  }

  const renameBranchWebsite = async () => {
    if (!project || !isOwner) return
    const from = selectedBranch || 'main'
    const to = renameBranchValue.trim()
    if (!to) { notify('Enter new branch name', 'info'); return }
    if (from === 'main') { notify('Cannot rename main', 'error'); return }
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData?.session?.access_token
      const res = await fetch(`/api/projects/${project.id}/branches`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ oldName: from, newName: to })
      })
      if (!res.ok) throw new Error(await res.text())
      setRenameBranchValue('')
      // Refresh branches list
      const refreshed = await fetch(`/api/projects/${project.id}/branches`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }, cache: 'no-store' })
      if (refreshed.ok) {
        const body = await refreshed.json()
        setBranches((Array.isArray(body?.data) ? body.data : []) as Array<{ id: string; name: string }>)
      }
      setSelectedBranch(to)
      notify('Branch renamed', 'success')
    } catch (e) {
      console.error(e)
      notify('Rename failed', 'error')
    }
  }

  const deleteBranchWebsite = async () => {
    if (!project || !isOwner) return
    const name = selectedBranch
    if (!name) { notify('Select a branch', 'info'); return }
    if (name === 'main') { notify('Cannot delete main', 'error'); return }
    if (!window.confirm(`Delete branch "${name}"?`)) return
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData?.session?.access_token
      const res = await fetch(`/api/projects/${project.id}/branches`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ name })
      })
      if (!res.ok) throw new Error(await res.text())
      // Refresh branches
      const refreshed = await fetch(`/api/projects/${project.id}/branches`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }, cache: 'no-store' })
      if (refreshed.ok) {
        const body = await refreshed.json()
        setBranches((Array.isArray(body?.data) ? body.data : []) as Array<{ id: string; name: string }>)
      }
      setSelectedBranch('')
      notify('Branch deleted', 'success')
    } catch (e) {
      console.error(e)
      notify('Delete failed', 'error')
    }
  }

  // Poll for new saves briefly after mount and after successful edits
  useEffect(() => {
    if (!project) return
    const t = setInterval(async () => {
      try {
        const res = await fetch(`/api/projects/${project.id}/saves`, { cache: 'no-store' })
        if (!res.ok) return
        const body = await res.json()
        setSaves((body?.data || []) as Array<{ id: string; created_at: string; change_summary: string | null }>)
      } catch {}
    }, 8000)
    return () => clearInterval(t)
  }, [project?.id])

  // Realtime updates for saves
  useEffect(() => {
    if (!project) return
    const channel = supabase
      .channel(`project_saves_${project.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'project_saves', filter: `project_id=eq.${project.id}` },
        (payload) => {
          const row = payload.new as { id: string; created_at: string; change_summary: string | null }
          setSaves(prev => [{ id: row.id, created_at: row.created_at, change_summary: row.change_summary }, ...prev])
        }
      )
      .subscribe()
    return () => {
      try { supabase.removeChannel(channel) } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id])

  // Realtime updates for commits (owner only)
  useEffect(() => {
    if (!project || !isOwner) return
    const channel = supabase
      .channel(`project_commits_${project.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'project_commits', filter: `project_id=eq.${project.id}` },
        (payload) => {
          const row = payload.new as { id: string; message: string; created_at: string; branch?: string; project_id?: string }
          // If filter matches current branch (or All), refresh first page
          if (!selectedBranch || selectedBranch === (row.branch || 'main')) {
            setCommitPage(1)
            // Lightweight prepend if already on page 1
            setCommits(prev => [{ id: row.id, message: (row as unknown as { message?: string }).message || '', created_at: row.created_at, branch: row.branch }, ...prev].slice(0, commitPageSize))
            setCommitTotal(t => t + 1)
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'project_commits', filter: `project_id=eq.${project.id}` },
        () => {
          setCommitPage(p => p)
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'project_commits', filter: `project_id=eq.${project.id}` },
        () => {
          setCommitTotal(t => Math.max(0, t - 1))
          setCommitPage(p => p)
        }
      )
      .subscribe()
    return () => {
      try { supabase.removeChannel(channel) } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id, isOwner, selectedBranch, commitPageSize, supabase])

  // Realtime updates for branches (owner only)
  useEffect(() => {
    if (!project || !isOwner) return
    const channel = supabase
      .channel(`project_branches_${project.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'project_branches', filter: `project_id=eq.${project.id}` },
        (payload) => {
          const row = payload.new as { id: string; name: string }
          setBranches(prev => [{ id: row.id, name: row.name }, ...prev])
        }
      )
      .subscribe()
    return () => {
      try { supabase.removeChannel(channel) } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id, isOwner])

  const postComment = async () => {
    if (!newComment.trim() || !project) return
    const { data: auth } = await supabase.auth.getUser()
    if (!auth?.user) {
      router.push('/auth/login')
      return
    }
    setPosting(true)
    try {
      const { error } = await supabase
        .from('comments')
        .insert({ project_id: project.id, user_id: auth.user.id, content: newComment.trim() })
      if (error) throw error
      setNewComment('')
      fetchComments()
    } catch (e) {
      console.error('Failed to post comment', e)
      alert('Failed to post comment')
    } finally {
      setPosting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'from-green-500/20 to-emerald-500/20 border-green-500/30 text-green-400'
      case 'intermediate': return 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30 text-yellow-400'
      case 'advanced': return 'from-red-500/20 to-pink-500/20 border-red-500/30 text-red-400'
      case 'expert': return 'from-purple-500/20 to-violet-500/20 border-purple-500/30 text-purple-400'
      default: return 'from-slate-500/20 to-gray-500/20 border-slate-500/30 text-slate-400'
    }
  }

  const getLanguageForHighlighter = (language: string) => {
    const langMap: Record<string, string> = {
      'JavaScript': 'javascript',
      'TypeScript': 'typescript',
      'Python': 'python',
      'Java': 'java',
      'C++': 'cpp',
      'C#': 'csharp',
      'Go': 'go',
      'Rust': 'rust',
      'PHP': 'php',
      'Ruby': 'ruby',
      'Swift': 'swift',
      'Kotlin': 'kotlin',
      'Dart': 'dart',
      'HTML': 'html',
      'CSS': 'css',
      'SQL': 'sql'
    }
    
    return langMap[language] || 'text'
  }

  const submitReport = async () => {
    if (!project || !reportReason.trim()) return
    const { data: auth } = await supabase.auth.getUser()
    if (!auth?.user) {
      router.push('/auth/login')
      return
    }
    try {
      const { error } = await supabase
        .from('project_reports')
        .insert({ project_id: project.id, reporter_id: auth.user.id, reason: reportReason.trim() })
      if (error) throw error
      setShowReport(false)
      setReportReason('')
      alert('Report submitted. Thank you for helping keep the community safe.')
    } catch (e) {
      console.error('Report failed', e)
      alert('Failed to submit report')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-900 pt-16 sm:pt-18 lg:pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto"></div>
            <p className="text-slate-400 mt-4">Loading project...</p>
          </div>
        </div>

        {/* Report Modal */}
        {showReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60" onClick={() => setShowReport(false)}></div>
            <div className="relative bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md mx-4">
              <h4 className="text-lg font-semibold text-white mb-3">Report Project</h4>
              <p className="text-slate-400 text-sm mb-3">Tell us what’s wrong with this project. Our team will review your report.</p>
              <textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                rows={4}
                placeholder="Reason for report"
                className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded text-white mb-4"
              />
              <div className="flex items-center justify-end gap-2">
                <button onClick={() => setShowReport(false)} className="px-3 py-2 bg-slate-800/50 border border-slate-700 rounded text-slate-300 hover:text-white">Cancel</button>
                <button onClick={submitReport} disabled={!reportReason.trim()} className="px-3 py-2 bg-gradient-to-r from-cyan-600 to-purple-600 text-white rounded disabled:opacity-60">Submit</button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (!project) {
    const backHref = searchParams.get('from') === 'my-projects' ? '/my-projects' : '/projects'
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-900 pt-16 sm:pt-18 lg:pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-white mb-2">Project not found</h2>
            <p className="text-slate-400 mb-6">The project you&apos;re looking for doesn&apos;t exist or has been removed.</p>
            <Link
              href={backHref}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-purple-600 text-white rounded-lg hover:from-cyan-500 hover:to-purple-500 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Projects</span>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const totalPages = useMemo(() => Math.max(1, Math.ceil((commitTotal || 0) / (commitPageSize || 1))), [commitTotal])
  const fromParam = searchParams.get('from')
  const backHref = fromParam === 'my-projects' ? '/my-projects' : '/projects'

  const handleDelete = async () => {
    if (!isOwner) return
    const confirmed = window.confirm('Delete this project? This cannot be undone.')
    if (!confirmed) return
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData?.session?.access_token
      const res = await fetch(`/api/projects/${project.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })
      if (!res.ok && res.status !== 204) {
        const text = await res.text().catch(() => '')
        throw new Error(text || `Failed with status ${res.status}`)
      }
      router.push(backHref)
    } catch (error) {
      console.error('Delete failed:', error)
      alert('Failed to delete project. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-900 pt-16 sm:pt-18 lg:pt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href={backHref}
            className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Projects</span>
          </Link>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={shareProject}
              className="p-2 text-slate-400 hover:text-cyan-400 transition-colors"
              title="Share Project"
            >
              <Share2 className="w-5 h-5" />
            </button>
            {isOwner && (
              <>
                <button
                  onClick={togglePublish}
                  className={`p-2 transition-colors ${project.is_public ? 'text-green-400 hover:text-yellow-400' : 'text-slate-400 hover:text-green-400'}`}
                  title={project.is_public ? 'Unpublish from Community' : 'Publish to Community'}
                >
                  {project.is_public ? 'Unpublish' : 'Publish'}
                </button>
                <Link
                  href={`/projects/${project.id}/edit${fromParam ? `?from=${fromParam}` : ''}`}
                  className="p-2 text-slate-400 hover:text-yellow-400 transition-colors"
                  title="Edit Project"
                >
                  <Edit className="w-5 h-5" />
                </Link>
                <button
                  onClick={handleDelete}
                  className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                  title="Delete Project"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </>
            )}
            {!isOwner && (
              <button
                onClick={() => setShowReport(true)}
                className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                title="Report Project"
              >
                <Flag className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Project Info */}
        <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-start gap-6">
            {/* Main Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <h1 className="text-3xl font-bold text-white mb-2">{project.title}</h1>
                <div className={`px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r ${getDifficultyColor(project.difficulty_level)} border`}>
                  {project.difficulty_level}
                </div>
              </div>
              
              {project.description && (
                <p className="text-slate-300 text-lg mb-6">{project.description}</p>
              )}

              {/* Author */}
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                  {project.user_profiles?.avatar_url ? (
                    <Image
                      src={project.user_profiles.avatar_url}
                      alt={project.user_profiles.full_name || project.user_profiles.username}
                      width={48}
                      height={48}
                      className="rounded-full"
                    />
                  ) : (
                    (project.user_profiles?.full_name || project.user_profiles?.username)?.charAt(0)?.toUpperCase()
                  )}
                </div>
                <div>
                  <Link
                    href={`/profile/${project.user_profiles?.username}`}
                    className="text-lg font-semibold text-white hover:text-cyan-300 transition-colors"
                  >
                    {project.user_profiles?.full_name || project.user_profiles?.username}
                  </Link>
                  <div className="flex items-center space-x-4 text-sm text-slate-400">
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(project.created_at)}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{project.estimated_time} min</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Tech Stack */}
              <div className="flex flex-wrap gap-3 mb-6">
                {project.language && (
                  <span className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full text-blue-300 text-sm font-medium">
                    {project.language}
                  </span>
                )}
                {project.framework && (
                  <span className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-green-300 text-sm font-medium">
                    {project.framework}
                  </span>
                )}
                {project.tags?.map(tag => (
                  <span key={tag} className="px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full text-purple-300 text-sm font-medium">
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Links */}
               <div className="flex items-center space-x-4">
                {project.demo_url && (
                  <a
                    href={project.demo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-cyan-600/20 to-purple-600/20 border border-cyan-500/30 text-cyan-300 rounded-lg hover:from-cyan-600/30 hover:to-purple-600/30 transition-all"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Live Demo</span>
                  </a>
                )}
                {project.github_url && (
                  <a
                    href={project.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 px-4 py-2 bg-slate-800/50 border border-slate-600 text-slate-300 rounded-lg hover:text-white hover:border-slate-500 transition-all"
                  >
                    <Github className="w-4 h-4" />
                    <span>Source Code</span>
                  </a>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="lg:w-48">
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700/50 p-4">
                <h3 className="text-white font-semibold mb-4">Project Stats</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleLike}
                        className={`flex items-center space-x-1 transition-colors ${
                          isLiked ? 'text-red-400' : 'text-slate-400 hover:text-red-400'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                        <span>Likes</span>
                      </button>
                    </div>
                    <span className="text-white font-medium">{project.total_likes}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-slate-400">
                      <Eye className="w-4 h-4" />
                      <span>Views</span>
                    </div>
                    <span className="text-white font-medium">{project.total_views}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-slate-400">
                      <MessageCircle className="w-4 h-4" />
                      <span>Comments</span>
                    </div>
                    <span className="text-white font-medium">{comments.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Code Display */}
        <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
            <h2 className="text-xl font-semibold text-white">Source Code</h2>
            <button
              onClick={copyCode}
              className="flex items-center space-x-2 px-3 py-1 bg-slate-800/50 border border-slate-600 text-slate-300 rounded hover:text-white hover:border-slate-500 transition-all"
            >
              {copying ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyan-400"></div>
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>
          
          <div className="relative">
            <SyntaxHighlighter
              language={getLanguageForHighlighter(project.language)}
              style={vscDarkPlus}
              customStyle={{
                margin: 0,
                background: 'transparent',
                fontSize: '14px',
                lineHeight: '1.5'
              }}
              showLineNumbers
              wrapLines
            >
              {project.content as string}
            </SyntaxHighlighter>
          </div>
        </div>

        {/* Comments Section */}
               <div className="mt-8 bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
            <MessageCircle className="w-5 h-5 text-cyan-400 mr-2" />
            Comments
          </h3>
          <div className="space-y-4">
            <div className="flex items-start gap-2">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your thoughts..."
                rows={3}
                className="flex-1 px-3 py-2 bg-slate-800/50 border border-slate-700 rounded text-white"
              />
              <button
                onClick={postComment}
                disabled={posting || !newComment.trim()}
                className="px-3 py-2 bg-gradient-to-r from-cyan-600 to-purple-600 text-white rounded-lg disabled:opacity-60 flex items-center gap-2"
              >
                {posting ? <div className="animate-spin h-4 w-4 border-b-2 border-white rounded-full" /> : <Send className="w-4 h-4" />}
                Post
              </button>
            </div>
            <div className="divide-y divide-slate-700/50">
              {comments.length === 0 ? (
                <p className="text-slate-400 text-sm">No comments yet.</p>
              ) : comments.map(c => (
                <div key={c.id} className="py-3">
                  <div className="text-sm text-slate-400 mb-1">@{c.user_profiles?.username} • {new Date(c.created_at).toLocaleString()}</div>
                  <div className="text-white whitespace-pre-wrap">{c.content}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Version Control - Commits (owner only) */}
        {isOwner && (
          <div className="mt-8 bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <GitCommit className="w-5 h-5 text-cyan-400 mr-2" />
              Commits
            </h3>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
              <div className="flex items-center gap-2">
                <label className="text-slate-400 text-sm">Branch</label>
                <select
                  value={selectedBranch}
                  onChange={(e) => { setSelectedBranch(e.target.value); setCommitPage(1); }}
                  className="px-2 py-1 bg-slate-800/50 border border-slate-600 rounded text-slate-200"
                >
                  <option value="">All</option>
                  <option value="main">main</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.name}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  placeholder="new-branch-name"
                  className="px-2 py-1 bg-slate-800/50 border border-slate-600 rounded text-slate-200 placeholder:text-slate-500"
                />
                <button
                  onClick={createBranch}
                  disabled={!newBranchName.trim()}
                  className="px-2 py-1 bg-slate-800/50 border border-slate-600 rounded text-slate-300 hover:text-white disabled:opacity-50"
                >Create branch</button>
                <input
                  value={renameBranchValue}
                  onChange={(e) => setRenameBranchValue(e.target.value)}
                  placeholder="rename selected →"
                  className="px-2 py-1 bg-slate-800/50 border border-slate-600 rounded text-slate-200 placeholder:text-slate-500"
                />
                <button
                  onClick={renameBranchWebsite}
                  className="px-2 py-1 bg-slate-800/50 border border-slate-600 rounded text-slate-300 hover:text-white"
                >Rename</button>
                <button
                  onClick={deleteBranchWebsite}
                  className="px-2 py-1 bg-slate-800/50 border border-slate-600 rounded text-slate-300 hover:text-white"
                >Delete</button>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={() => setCommitPage(p => Math.max(1, p - 1))}
                  disabled={commitPage <= 1}
                  className="px-2 py-1 bg-slate-800/50 border border-slate-600 rounded text-slate-300 disabled:opacity-50"
                >Prev</button>
                <span className="text-slate-400 text-sm">Page {commitPage} / {totalPages}</span>
                <button
                  onClick={() => setCommitPage(p => Math.min(totalPages, p + 1))}
                  disabled={commitPage >= totalPages}
                  className="px-2 py-1 bg-slate-800/50 border border-slate-600 rounded text-slate-300 disabled:opacity-50"
                >Next</button>
              </div>
            </div>
            {commits.length === 0 ? (
              <p className="text-slate-400 text-sm">No commits yet.</p>
            ) : (
              <ul className="space-y-2">
                {commits.map(c => (
                  <li key={c.id} className="flex items-center justify-between text-sm text-slate-300">
                    <div className="truncate">
                      <span className="text-white font-medium">{c.message}</span>
                      <span className="text-slate-400 ml-2">{new Date(c.created_at).toLocaleString()} • {c.branch || 'main'}</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => viewCommit(c.id)} className="px-2 py-1 bg-slate-800/50 border border-slate-600 rounded text-slate-300 hover:text-white">View</button>
                      <button onClick={() => restoreCommit(c.id)} className="px-2 py-1 bg-gradient-to-r from-cyan-600 to-purple-600 text-white rounded">Restore</button>
                      <button
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(c.id)
                          } catch {}
                        }}
                        className="px-2 py-1 bg-slate-800/50 border border-slate-600 rounded text-slate-300 hover:text-white"
                      >Copy ID</button>
                      <a href={`/editor?project=${project.id}`} className="px-2 py-1 bg-slate-800/50 border border-slate-600 rounded text-slate-300 hover:text-white">Open in editor</a>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {viewingCommitId && (
              <div className="mt-4">
                <h4 className="text-white font-semibold mb-2">Diff vs current</h4>
                <div className="text-xs text-slate-400 mb-2">Green = added, Red = removed</div>
                <div className="max-h-96 overflow-auto border border-slate-700/50 rounded p-3 text-sm font-mono whitespace-pre-wrap">
                  {(() => {
                    const oldLines = String(commitContent || '').split('\n')
                    const newLines = String(project.content || '').split('\n')
                    const max = Math.max(oldLines.length, newLines.length)
                    const rows: Array<{ t: 'ctx' | 'add' | 'rem'; v: string; ln?: number }> = []
                    for (let i = 0; i < max; i += 1) {
                      const a = oldLines[i] ?? ''
                      const b = newLines[i] ?? ''
                      if (a === b) rows.push({ t: 'ctx', v: a, ln: i + 1 })
                      else {
                        if (a) rows.push({ t: 'rem', v: a, ln: i + 1 })
                        if (b) rows.push({ t: 'add', v: b, ln: i + 1 })
                      }
                    }
                    const grouped: Array<{ kind: 'row' | 'skip'; data?: { t: 'ctx' | 'add' | 'rem'; v: string; ln?: number } | { t: 'change'; a: { v: string; ln?: number }; b: { v: string; ln?: number } }; skipCount?: number }> = []
                    let ctxRun: Array<{ t: 'ctx' | 'add' | 'rem'; v: string; ln?: number }> = []
                    const flushCtx = () => {
                      if (ctxRun.length <= 6) {
                        ctxRun.forEach(r => grouped.push({ kind: 'row', data: r }))
                      } else {
                        // show first 3 and last 3
                        ctxRun.slice(0, 3).forEach(r => grouped.push({ kind: 'row', data: r }))
                        grouped.push({ kind: 'skip', skipCount: ctxRun.length - 6 })
                        ctxRun.slice(-3).forEach(r => grouped.push({ kind: 'row', data: r }))
                      }
                      ctxRun = []
                    }
                    rows.forEach((r, idx) => {
                      if (r.t === 'ctx') {
                        ctxRun.push(r)
                      } else {
                        if (ctxRun.length) flushCtx()
                        if (r.t === 'rem' && idx + 1 < rows.length && rows[idx + 1].t === 'add') {
                          grouped.push({ kind: 'row', data: { t: 'change', a: { v: r.v, ln: r.ln }, b: { v: rows[idx + 1].v, ln: rows[idx + 1].ln } } })
                        } else if (r.t === 'add' && idx > 0 && rows[idx - 1].t === 'rem') {
                          // handled in previous pair
                        } else {
                          grouped.push({ kind: 'row', data: r })
                        }
                      }
                    })
                    if (ctxRun.length) flushCtx()
                    return grouped.map((g, idx) => {
                      if (g.kind === 'skip') {
                        return (
                          <div key={idx} className="text-slate-500 text-xs py-1 px-2 italic opacity-70">… {g.skipCount} unchanged lines …</div>
                        )
                      }
                      const data = g.data as unknown as { t?: 'change' | 'ctx' | 'add' | 'rem'; a?: { v: string; ln?: number }; b?: { v: string; ln?: number }; ln?: number; v?: string }
                      if (data?.t === 'change') {
                        const { prefix, aMid, bMid, suffix } = inlineDiffSegments(data.a.v, data.b.v)
                        return (
                          <div key={idx} className="text-slate-300">
                            <div className="bg-red-500/10 text-red-300">
                              <span className="opacity-50 mr-2 select-none" style={{ display: 'inline-block', width: 40, textAlign: 'right' }}>{data.a.ln}</span>
                              - {prefix}<span className="bg-red-600/30">{aMid}</span>{suffix}
                            </div>
                            <div className="bg-green-500/10 text-green-300">
                              <span className="opacity-50 mr-2 select-none" style={{ display: 'inline-block', width: 40, textAlign: 'right' }}>{data.b.ln}</span>
                              + {prefix}<span className="bg-green-600/30">{bMid}</span>{suffix}
                            </div>
                          </div>
                        )
                      }
                      const r = data
                      return (
                        <div key={idx} className={r.t === 'add' ? 'bg-green-500/10 text-green-300' : r.t === 'rem' ? 'bg-red-500/10 text-red-300' : 'text-slate-300'}>
                          <span className="opacity-50 mr-2 select-none" style={{ display: 'inline-block', width: 40, textAlign: 'right' }}>{r.ln}</span>
                          {r.t === 'add' ? '+ ' : r.t === 'rem' ? '- ' : '  '}{r.v}
                        </div>
                      )
                    })
                  })()}
                </div>
              </div>
            )}
          </div>
        )}

        {isOwner && (
          <div className="mt-8 bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <GitCommit className="w-5 h-5 text-purple-400 mr-2" />
              Compare branches
            </h3>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
              <div className="flex items-center gap-2">
                <label className="text-slate-400 text-sm">A</label>
                <select value={compareA} onChange={(e) => setCompareA(e.target.value)} className="px-2 py-1 bg-slate-800/50 border border-slate-600 rounded text-slate-200">
                  <option value="main">main</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.name}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-slate-400 text-sm">B</label>
                <select value={compareB} onChange={(e) => setCompareB(e.target.value)} className="px-2 py-1 bg-slate-800/50 border border-slate-600 rounded text-slate-200">
                  <option value="">Select</option>
                  <option value="main">main</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.name}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <button onClick={handleCompareBranches} disabled={!compareA || !compareB || compareLoading} className="px-2 py-1 bg-slate-800/50 border border-slate-600 rounded text-slate-300 disabled:opacity-50">Compare</button>
                <button onClick={handleMergeAdopt} disabled={!compareA || !compareB || compareA === compareB} className="px-2 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded disabled:opacity-50">Merge (adopt A→B)</button>
              </div>
            </div>
            <div className="max-h-96 overflow-auto border border-slate-700/50 rounded p-3 text-sm font-mono whitespace-pre-wrap">
              {compareLoading ? (
                <div className="text-slate-400">Loading…</div>
              ) : compareRows.length === 0 ? (
                <div className="text-slate-400">No diff or no commits to compare.</div>
              ) : (
                (() => {
                  const rows = compareRows
                  const grouped: Array<{ kind: 'row' | 'skip'; data?: { t: 'ctx' | 'add' | 'rem'; v: string; ln?: number }; skipCount?: number }> = []
                  let ctxRun: Array<{ t: 'ctx' | 'add' | 'rem'; v: string; ln?: number }> = []
                  const flushCtx = () => {
                    if (ctxRun.length <= 6) {
                      ctxRun.forEach(r => grouped.push({ kind: 'row', data: r }))
                    } else {
                      ctxRun.slice(0, 3).forEach(r => grouped.push({ kind: 'row', data: r }))
                      grouped.push({ kind: 'skip', skipCount: ctxRun.length - 6 })
                      ctxRun.slice(-3).forEach(r => grouped.push({ kind: 'row', data: r }))
                    }
                    ctxRun = []
                  }
                  rows.forEach(r => {
                    if (r.t === 'ctx') ctxRun.push(r)
                    else {
                      if (ctxRun.length) flushCtx()
                      grouped.push({ kind: 'row', data: r })
                    }
                  })
                  if (ctxRun.length) flushCtx()
                  return grouped.map((g, idx) => {
                    if (g.kind === 'skip') return <div key={idx} className="text-slate-500 text-xs py-1 px-2 italic opacity-70">… {g.skipCount} unchanged lines …</div>
                    const r = g.data!
                    return (
                      <div key={idx} className={r.t === 'add' ? 'bg-green-500/10 text-green-300' : r.t === 'rem' ? 'bg-red-500/10 text-red-300' : 'text-slate-300'}>
                        <span className="opacity-50 mr-2 select-none" style={{ display: 'inline-block', width: 40, textAlign: 'right' }}>{r.ln}</span>
                        {r.t === 'add' ? '+ ' : r.t === 'rem' ? '- ' : '  '}{r.v}
                      </div>
                    )
                  })
                })()
              )}
            </div>
          </div>
        )}

        {/* Save History */}
        <div className="mt-8 bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
            <History className="w-5 h-5 text-cyan-400 mr-2" />
            Save History
          </h3>
          {saves.length === 0 ? (
            <p className="text-slate-400 text-sm">No save history yet.</p>
          ) : (
            <ul className="space-y-2">
              {saves.slice(0, 10).map(s => (
                <li key={s.id} className="flex items-center justify-between text-sm text-slate-300">
                  <span>{new Date(s.created_at).toLocaleString()}</span>
                  <span className="text-slate-400 truncate max-w-[60%]">{s.change_summary || 'Updated content'}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      {/* Toasts */}
      <div className="fixed top-16 right-4 z-[1000] space-y-2">
        {toasts.map(t => (
          <div key={t.id} className={`px-3 py-2 rounded border shadow text-sm ${t.type === 'success' ? 'bg-green-600/20 border-green-500/40 text-green-200' : t.type === 'error' ? 'bg-red-600/20 border-red-500/40 text-red-200' : 'bg-slate-700/50 border-slate-500/40 text-slate-200'}`}>
            {t.text}
          </div>
        ))}
      </div>
    </div>
  )
}