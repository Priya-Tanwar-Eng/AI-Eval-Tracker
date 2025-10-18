'use client'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function EvalDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const router = useRouter()
  const [evaluation, setEvaluation] = useState(null)
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchEvaluation()
      fetchSettings()
    }
  }, [user, id])

  const fetchEvaluation = async () => {
    const { data, error } = await supabase
      .from('evaluations')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error) {
      console.error('Error fetching evaluation:', error)
    } else {
      setEvaluation(data)
    }
    setLoading(false)
  }

  const fetchSettings = async () => {
    const { data } = await supabase
      .from('user_settings')
      .select('obfuscate_pii')
      .eq('user_id', user.id)
      .single()

    if (data) {
      setSettings(data)
    }
  }

  const obfuscateText = (text) => {
    if (!settings?.obfuscate_pii) return text
    
    // Simple PII obfuscation (email, phone, names)
    return text
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]')
      .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE]')
      .replace(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, '[NAME]')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-gray-600">Loading evaluation...</div>
      </div>
    )
  }

  if (!evaluation) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Evaluation not found</h2>
        <Link href="/dashboard" className="text-blue-600 hover:underline">
          Back to Dashboard
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link href="/dashboard" className="text-blue-600 hover:underline mb-4 inline-block">
          ← Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-gray-800">Evaluation Details</h1>
      </div>

      {/* Overview Card */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">Interaction ID</p>
            <p className="font-mono text-sm text-gray-900 truncate">
              {evaluation.interaction_id}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Score</p>
            <p className={`text-lg font-bold ${
              evaluation.score >= 0.7 ? 'text-green-600' : 'text-red-600'
            }`}>
              {evaluation.score}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Latency</p>
            <p className="text-lg font-bold text-gray-900">
              {evaluation.latency_ms}ms
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Date</p>
            <p className="text-sm text-gray-900">
              {new Date(evaluation.created_at).toLocaleString()}
            </p>
          </div>
        </div>

        {evaluation.pii_tokens_redacted > 0 && (
          <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-sm text-yellow-800">
              🔒 {evaluation.pii_tokens_redacted} PII token(s) redacted
            </p>
          </div>
        )}

        {evaluation.flags && evaluation.flags.length > 0 && (
          <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
            <p className="text-sm text-red-800">
              ⚠️ Flags: {evaluation.flags.join(', ')}
            </p>
          </div>
        )}
      </div>

      {/* Prompt Card */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Prompt</h2>
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <p className="text-gray-900 whitespace-pre-wrap">
            {obfuscateText(evaluation.prompt)}
          </p>
        </div>
        {settings?.obfuscate_pii && (
          <p className="text-xs text-gray-500 mt-2">
            * PII obfuscation is enabled
          </p>
        )}
      </div>

      {/* Response Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Response</h2>
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <p className="text-gray-900 whitespace-pre-wrap">
            {obfuscateText(evaluation.response)}
          </p>
        </div>
        {settings?.obfuscate_pii && (
          <p className="text-xs text-gray-500 mt-2">
            * PII obfuscation is enabled
          </p>
        )}
      </div>
    </div>
  )
}