'use client'

import { useMemo } from 'react'
import { Brain, DollarSign, Zap, Calendar } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

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

interface AIUsageContentProps {
  usageData: AIUsageRecord[]
}

export function AIUsageContent({ usageData }: AIUsageContentProps) {
  // Calculate total statistics
  const stats = useMemo(() => {
    const totalRequests = usageData.length
    const totalTokens = usageData.reduce((sum, record) => sum + (record.tokens_used || 0), 0)
    const totalCost = usageData.reduce((sum, record) => sum + (record.total_usd || 0), 0)
    
    // Current month data
    const currentMonthStart = new Date()
    currentMonthStart.setDate(1)
    currentMonthStart.setHours(0, 0, 0, 0)
    
    const currentMonthData = usageData.filter(record => 
      new Date(record.created_at) >= currentMonthStart
    )
    
    const monthlyTokens = currentMonthData.reduce((sum, record) => sum + (record.tokens_used || 0), 0)
    const monthlyCost = currentMonthData.reduce((sum, record) => sum + (record.total_usd || 0), 0)
    
    return {
      totalRequests,
      totalTokens,
      totalCost,
      monthlyTokens,
      monthlyCost,
      monthlyRequests: currentMonthData.length
    }
  }, [usageData])

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4,
      maximumFractionDigits: 6
    }).format(amount)
  }

  // Format number with commas
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-900 pt-16 sm:pt-18 lg:pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">AI Usage</h1>
              <p className="text-gray-400">Track your AI assistant usage and costs</p>
            </div>
          </div>
          
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
            <span>/</span>
            <Link href="/profile/setup" className="hover:text-white transition-colors">Profile</Link>
            <span>/</span>
            <span className="text-white">AI Usage</span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Requests */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-gray-400 font-medium">Total Requests</h3>
            </div>
            <p className="text-3xl font-bold text-white">{formatNumber(stats.totalRequests)}</p>
            <p className="text-sm text-gray-500 mt-1">All-time</p>
          </div>

          {/* Total Tokens */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-gray-400 font-medium">Total Tokens</h3>
            </div>
            <p className="text-3xl font-bold text-white">{formatNumber(stats.totalTokens)}</p>
            <p className="text-sm text-gray-500 mt-1">All-time</p>
          </div>

          {/* Total Cost */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-gray-400 font-medium">Total Cost</h3>
            </div>
            <p className="text-3xl font-bold text-white">{formatCurrency(stats.totalCost)}</p>
            <p className="text-sm text-gray-500 mt-1">All-time</p>
          </div>

          {/* This Month */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-gray-400 font-medium">This Month</h3>
            </div>
            <p className="text-2xl font-bold text-white">{formatCurrency(stats.monthlyCost)}</p>
            <p className="text-sm text-gray-500 mt-1">{formatNumber(stats.monthlyTokens)} tokens</p>
          </div>
        </div>

        {/* Usage Table */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-xl font-bold text-white">Recent Usage</h2>
            <p className="text-gray-400 text-sm mt-1">Your AI assistant interactions</p>
          </div>

          {usageData.length === 0 ? (
            <div className="p-12 text-center">
              <Brain className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-400 mb-2">No usage data yet</h3>
              <p className="text-gray-500 mb-6">Start using the AI assistant to see your usage here</p>
              <Link 
                href="/editor"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl text-white font-medium hover:shadow-lg hover:shadow-purple-500/25 transition-all"
              >
                <Brain className="w-5 h-5" />
                Open Editor
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300">Date</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300">Model</th>
                    <th className="text-right px-6 py-4 text-sm font-semibold text-gray-300">Tokens</th>
                    <th className="text-right px-6 py-4 text-sm font-semibold text-gray-300">Base Cost</th>
                    <th className="text-right px-6 py-4 text-sm font-semibold text-gray-300">Markup</th>
                    <th className="text-right px-6 py-4 text-sm font-semibold text-gray-300">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {usageData.map((record) => (
                    <tr key={record.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm text-white">
                          {new Date(record.created_at).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(record.created_at), { addSuffix: true })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/20 text-purple-400 rounded-lg text-sm font-medium">
                          <Brain className="w-4 h-4" />
                          {record.model}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-white font-mono text-sm">
                          {formatNumber(record.tokens_used || 0)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-gray-400 font-mono text-sm">
                          {formatCurrency(record.cost_usd || 0)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-gray-400 font-mono text-sm">
                          {formatCurrency(record.markup_usd || 0)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-white font-mono text-sm font-semibold">
                          {formatCurrency(record.total_usd || 0)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Info Section */}
        {usageData.length > 0 && (
          <div className="mt-6 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
            <p className="text-sm text-blue-300">
              <strong>Note:</strong> AI usage is tracked per request. Costs include base API pricing plus a small markup to support platform development. 
              All prices are in USD and calculated based on token usage.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
