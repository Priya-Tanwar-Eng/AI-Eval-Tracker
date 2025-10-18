'use client'
import { useAuth } from '../../../lib/AuthContext'
import { supabase } from '../../../lib/supabase'
import { useEffect, useState } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import Link from 'next/link'

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    total: 0,
    avgScore: 0,
    avgLatency: 0,
    successRate: 0
  })
  const [trendData, setTrendData] = useState([])
  const [recentEvals, setRecentEvals] = useState([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState(7)

  useEffect(() => {
    if (user) {
      fetchDashboardData()
    }
  }, [user, timeRange])

  const fetchDashboardData = async () => {
    setLoading(true)
    const daysAgo = new Date()
    daysAgo.setDate(daysAgo.getDate() - timeRange)

    const { data: evals, error } = await supabase
      .from('evaluations')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', daysAgo.toISOString())
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching evals:', error)
      setLoading(false)
      return
    }

    if (evals && evals.length > 0) {
      const avgScore = evals.reduce((sum, e) => sum + parseFloat(e.score), 0) / evals.length
      const avgLatency = evals.reduce((sum, e) => sum + e.latency_ms, 0) / evals.length
      const successRate = (evals.filter(e => e.score >= 0.7).length / evals.length) * 100

      setStats({
        total: evals.length,
        avgScore: avgScore.toFixed(2),
        avgLatency: Math.round(avgLatency),
        successRate: successRate.toFixed(1)
      })

      // YE LINE CHANGE HO GAYI - eval -> evaluation
      const groupedByDate = evals.reduce((acc, evaluation) => {
        const date = new Date(evaluation.created_at).toLocaleDateString()
        if (!acc[date]) {
          acc[date] = { date, count: 0, totalScore: 0, totalLatency: 0 }
        }
        acc[date].count += 1
        acc[date].totalScore += parseFloat(evaluation.score)
        acc[date].totalLatency += evaluation.latency_ms
        return acc
      }, {})

      const trendArray = Object.values(groupedByDate).map(day => ({
        date: day.date,
        avgScore: (day.totalScore / day.count).toFixed(2),
        avgLatency: Math.round(day.totalLatency / day.count),
        count: day.count
      })).reverse()

      setTrendData(trendArray)
      setRecentEvals(evals.slice(0, 10))
    } else {
      setStats({ total: 0, avgScore: 0, avgLatency: 0, successRate: 0 })
      setTrendData([])
      setRecentEvals([])
    }

    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-gray-600">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setTimeRange(7)}
            className={`px-4 py-2 rounded-lg ${
              timeRange === 7
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 border border-gray-300'
            }`}
          >
            7 Days
          </button>
          <button
            onClick={() => setTimeRange(30)}
            className={`px-4 py-2 rounded-lg ${
              timeRange === 30
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 border border-gray-300'
            }`}
          >
            30 Days
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Total Evaluations" value={stats.total} bgColor="bg-blue-50" />
        <StatCard title="Avg Score" value={stats.avgScore} bgColor="bg-green-50" />
        <StatCard title="Avg Latency" value={`${stats.avgLatency}ms`} bgColor="bg-orange-50" />
        <StatCard title="Success Rate" value={`${stats.successRate}%`} bgColor="bg-purple-50" />
      </div>

      {trendData.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Score Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 1]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="avgScore" stroke="#3b82f6" name="Avg Score" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Latency Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="avgLatency" fill="#f97316" name="Avg Latency (ms)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="bg-white p-12 rounded-lg shadow text-center">
          <p className="text-gray-500 text-lg mb-4">No evaluation data yet</p>
          <p className="text-gray-400">Use the API to ingest evaluations or run the seed script</p>
        </div>
      )}

      {recentEvals.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold text-gray-800">Recent Evaluations</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Latency</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Flags</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {/* YE LINE BHI CHANGE HO GAYI - eval -> evaluation */}
                {recentEvals.map((evaluation) => (
                  <tr key={evaluation.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{evaluation.interaction_id.slice(0, 12)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        evaluation.score >= 0.7 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {evaluation.score}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{evaluation.latency_ms}ms</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {evaluation.flags?.length > 0 ? evaluation.flags.join(', ') : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(evaluation.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ title, value, bgColor }) {
  return (
    <div className={`${bgColor} rounded-lg p-6 shadow`}>
      <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
  )
}