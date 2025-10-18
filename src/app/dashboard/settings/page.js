'use client'
import { useAuth } from '../../../../lib/AuthContext'
import { supabase } from '../../../../lib/supabase'
import { useEffect, useState } from 'react'
                
export default function Settings() {
  const { user } = useAuth()
  const [settings, setSettings] = useState({
    run_policy: 'always',
    sample_rate_pct: 100,
    obfuscate_pii: false,
    max_eval_per_day: 1000
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (user) {
      fetchSettings()
    }
  }, [user])

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching settings:', error)
    } else if (data) {
      setSettings({
        run_policy: data.run_policy || 'always',
        sample_rate_pct: data.sample_rate_pct || 100,
        obfuscate_pii: data.obfuscate_pii || false,
        max_eval_per_day: data.max_eval_per_day || 1000
      })
    }
    setLoading(false)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    const { data: existing } = await supabase
      .from('user_settings')
      .select('id')
      .eq('user_id', user.id)
      .single()

    let result
    if (existing) {
      result = await supabase
        .from('user_settings')
        .update({
          run_policy: settings.run_policy,
          sample_rate_pct: parseInt(settings.sample_rate_pct) || 100,
          obfuscate_pii: settings.obfuscate_pii,
          max_eval_per_day: parseInt(settings.max_eval_per_day) || 1000,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
    } else {
      result = await supabase
        .from('user_settings')
        .insert({
          user_id: user.id,
          run_policy: settings.run_policy,
          sample_rate_pct: parseInt(settings.sample_rate_pct) || 100,
          obfuscate_pii: settings.obfuscate_pii,
          max_eval_per_day: parseInt(settings.max_eval_per_day) || 1000
        })
    }

    if (result.error) {
      setMessage('Error saving settings: ' + result.error.message)
    } else {
      setMessage('Settings saved successfully!')
      setTimeout(() => setMessage(''), 3000)
    }

    setSaving(false)
  }

  const handleNumberChange = (field, value) => {
    const numValue = value === '' ? '' : parseInt(value) || 0
    setSettings({ ...settings, [field]: numValue })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-gray-600">Loading settings...</div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Evaluation Settings</h1>

      <form onSubmit={handleSave} className="bg-white rounded-lg shadow p-6 space-y-6">
        {/* Run Policy */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Run Policy
          </label>
          <select
            value={settings.run_policy}
            onChange={(e) => setSettings({ ...settings, run_policy: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="always">Always Run</option>
            <option value="sampled">Sampled</option>
          </select>
          <p className="text-sm text-gray-500 mt-1">
            Choose when to run evaluations
          </p>
        </div>

        {/* Sample Rate */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sample Rate (%)
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={settings.sample_rate_pct}
            onChange={(e) => handleNumberChange('sample_rate_pct', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={settings.run_policy === 'always'}
          />
          <p className="text-sm text-gray-500 mt-1">
            Percentage of evaluations to run (only applies when sampled)
          </p>
        </div>

        {/* Obfuscate PII */}
        <div className="flex items-center justify-between">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Obfuscate PII
            </label>
            <p className="text-sm text-gray-500 mt-1">
              Hide personally identifiable information in prompts/responses
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSettings({ ...settings, obfuscate_pii: !settings.obfuscate_pii })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.obfuscate_pii ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.obfuscate_pii ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Max Eval Per Day */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Max Evaluations Per Day
          </label>
          <input
            type="number"
            min="1"
            value={settings.max_eval_per_day}
            onChange={(e) => handleNumberChange('max_eval_per_day', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-sm text-gray-500 mt-1">
            Maximum number of evaluations allowed per day
          </p>
        </div>

        {/* Message */}
        {message && (
          <div className={`p-4 rounded-lg ${
            message.includes('Error') 
              ? 'bg-red-50 text-red-600' 
              : 'bg-green-50 text-green-600'
          }`}>
            {message}
          </div>
        )}

        {/* Save Button */}
        <button
          type="submit"
          disabled={saving}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  )
}