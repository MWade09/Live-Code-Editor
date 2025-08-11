'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Shield, CheckCircle2, XCircle, Star, EyeOff } from 'lucide-react'

type Report = {
  id: string
  reason: string
  status: 'open' | 'reviewing' | 'resolved' | 'dismissed'
  created_at: string
  updated_at: string
  project_id: string
  reporter_id: string
  projects: { id: string; title: string; is_public: boolean; is_featured: boolean; status: string; user_id: string }
  reporter: { id: string; username: string; full_name: string | null }
}

export default function ModerationPage() {
  const supabase = createClient()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'open' | 'reviewing' | 'resolved' | 'dismissed' | 'all'>('open')

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/reports')
      if (!res.ok) throw new Error(await res.text())
      const body = await res.json()
      setReports(body.data as Report[])
    } catch (e) {
      console.error(e)
      setError('Failed to load reports')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const visibleReports = useMemo(() => {
    if (filter === 'all') return reports
    return reports.filter(r => r.status === filter)
  }, [reports, filter])

  const updateReport = async (id: string, status: Report['status']) => {
    const res = await fetch(`/api/admin/reports/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
    if (!res.ok) {
      alert('Failed to update report')
      return
    }
    load()
  }

  const featureProject = async (projectId: string, isFeatured: boolean) => {
    const res = await fetch(`/api/admin/projects/${projectId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_featured: isFeatured }) })
    if (!res.ok) {
      alert('Failed to update featured status')
      return
    }
    load()
  }

  const unpublishProject = async (projectId: string) => {
    const res = await fetch(`/api/admin/projects/${projectId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'draft' }) })
    if (!res.ok) {
      alert('Failed to unpublish project')
      return
    }
    load()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-900 pt-16 sm:pt-18 lg:pt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-cyan-200 to-purple-200 bg-clip-text text-transparent flex items-center gap-2">
            <Shield className="w-7 h-7 text-cyan-400" /> Moderation
          </h1>
          <div className="flex items-center gap-2">
            <select value={filter} onChange={(e) => setFilter(e.target.value as any)} className="px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white">
              <option value="open">Open</option>
              <option value="reviewing">Reviewing</option>
              <option value="resolved">Resolved</option>
              <option value="dismissed">Dismissed</option>
              <option value="all">All</option>
            </select>
            <button onClick={load} className="px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-300 hover:text-white">Refresh</button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-300 rounded">{error}</div>
        )}

        {loading ? (
          <div className="text-center py-12 text-slate-400">Loading reports...</div>
        ) : visibleReports.length === 0 ? (
          <div className="text-center py-12 text-slate-400">No reports</div>
        ) : (
          <div className="space-y-4">
            {visibleReports.map(r => (
              <div key={r.id} className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4">
                <div className="flex items-center justify-between">
                  <div className="text-white font-semibold">{r.projects?.title || 'Untitled Project'}</div>
                  <div className="text-xs text-slate-400">{new Date(r.created_at).toLocaleString()}</div>
                </div>
                <div className="text-slate-300 mt-2">{r.reason}</div>
                <div className="text-sm text-slate-400 mt-1">Reported by @{r.reporter?.username || r.reporter_id}</div>
                <div className="flex items-center gap-2 mt-3">
                  <Link href={`/projects/${r.project_id}`} className="px-3 py-1 bg-slate-800/50 text-slate-300 border border-slate-600 rounded hover:text-white">View</Link>
                  <button onClick={() => featureProject(r.project_id, !r.projects?.is_featured)} className="px-3 py-1 bg-yellow-600/20 text-yellow-300 border border-yellow-500/30 rounded hover:bg-yellow-600/30 inline-flex items-center gap-1">
                    <Star className="w-4 h-4" /> {r.projects?.is_featured ? 'Unfeature' : 'Feature'}
                  </button>
                  <button onClick={() => unpublishProject(r.project_id)} className="px-3 py-1 bg-red-600/20 text-red-300 border border-red-500/30 rounded hover:bg-red-600/30 inline-flex items-center gap-1">
                    <EyeOff className="w-4 h-4" /> Unpublish
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <button onClick={() => updateReport(r.id, 'reviewing')} className="px-3 py-1 bg-slate-800/50 text-slate-300 border border-slate-600 rounded hover:text-white inline-flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Mark Reviewing
                  </button>
                  <button onClick={() => updateReport(r.id, 'resolved')} className="px-3 py-1 bg-green-600/20 text-green-300 border border-green-500/30 rounded hover:bg-green-600/30 inline-flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Resolve
                  </button>
                  <button onClick={() => updateReport(r.id, 'dismissed')} className="px-3 py-1 bg-red-600/20 text-red-300 border border-red-500/30 rounded hover:bg-red-600/30 inline-flex items-center gap-1">
                    <XCircle className="w-4 h-4" /> Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


