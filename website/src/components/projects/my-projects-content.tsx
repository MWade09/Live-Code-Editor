'use client'

import { useMemo, useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useUserProjects } from '@/hooks/useDatabase'
import { Code, Eye, Heart, Filter, SortAsc, SortDesc, Lock, Globe, RefreshCw, Search, Plus } from 'lucide-react'

type SortKey = 'updated_at' | 'created_at' | 'title'
type SortOrder = 'asc' | 'desc'

interface Props {
  userId: string
}

export default function MyProjectsContent({ userId }: Props) {
  const supabase = createClient()
  const [query, setQuery] = useState('')
  const [visibility, setVisibility] = useState<'all' | 'public' | 'private'>('all')
  const [sortBy, setSortBy] = useState<SortKey>('updated_at')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  const { projects, loading, error, refetch } = useUserProjects(userId, true)

  const filtered = useMemo(() => {
    const items = projects?.data || []
    let next = items
    if (visibility !== 'all') {
      next = next.filter(p => (visibility === 'public' ? p.is_public : !p.is_public))
    }
    if (query.trim()) {
      const q = query.toLowerCase()
      next = next.filter(p => p.title.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q))
    }
    next = [...next].sort((a, b) => {
      const av = (a as any)[sortBy]
      const bv = (b as any)[sortBy]
      if (av === bv) return 0
      if (sortOrder === 'asc') return av > bv ? 1 : -1
      return av < bv ? 1 : -1
    })
    return next
  }, [projects, query, visibility, sortBy, sortOrder])

  useEffect(() => {
    // Ensure session is fresh while on page (for private opens)
    supabase.auth.getSession()
  }, [supabase])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-900 pt-16 sm:pt-18 lg:pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-cyan-200 to-purple-200 bg-clip-text text-transparent">My Projects</h1>
          <div className="flex items-center gap-3">
            <Link href="/projects/create" className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-purple-600 text-white rounded-lg hover:from-cyan-500 hover:to-purple-500 transition-all">
              <Plus className="w-4 h-4" /> New Project
            </Link>
            <button onClick={refetch} className="px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-300 hover:text-white hover:border-slate-600 transition-colors flex items-center gap-2">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              placeholder="Search by title or description"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select value={visibility} onChange={(e) => setVisibility(e.target.value as any)} className="flex-1 px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white">
              <option value="all">All</option>
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            {sortOrder === 'asc' ? <SortAsc className="w-4 h-4 text-slate-400" /> : <SortDesc className="w-4 h-4 text-slate-400" />}
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortKey)} className="flex-1 px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white">
              <option value="updated_at">Last Updated</option>
              <option value="created_at">Date Created</option>
              <option value="title">Title</option>
            </select>
            <button onClick={() => setSortOrder(s => s === 'asc' ? 'desc' : 'asc')} className="px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-300 hover:text-white hover:border-slate-600">{sortOrder.toUpperCase()}</button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-800/50 text-slate-300">
              <tr>
                <th className="text-left px-4 py-3">Title</th>
                <th className="text-left px-4 py-3">Visibility</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Updated</th>
                <th className="text-left px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">Loading projects...</td></tr>
              ) : (filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">No projects found</td></tr>
              ) : filtered.map(p => (
                <tr key={p.id} className="hover:bg-slate-800/30">
                  <td className="px-4 py-3 text-white font-medium">{p.title}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${p.is_public ? 'text-green-400 bg-green-500/10 border border-green-500/30' : 'text-yellow-400 bg-yellow-500/10 border border-yellow-500/30'}`}>
                      {p.is_public ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />} {p.is_public ? 'Public' : 'Private'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300 capitalize">{p.status}</td>
                  <td className="px-4 py-3 text-slate-400">{new Date(p.updated_at).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link href={`/editor?project=${p.id}`} className="px-3 py-1 bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 rounded hover:bg-cyan-600/30 transition-colors flex items-center gap-1">
                        <Code className="w-4 h-4" /> Open
                      </Link>
                      <Link href={`/projects/${p.id}/share`} className="px-3 py-1 bg-slate-800/50 text-slate-300 border border-slate-600 rounded hover:bg-slate-700/50 transition-colors">
                        Share
                      </Link>
                    </div>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}


