const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const DEMO_EMAIL = 'demo@test.com'
const DEMO_PASSWORD = 'demo1234'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function seedProduction() {
  console.log(' Production Seed - AI Eval Tracker\n')

  // Login
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD
  })

  if (authError) {
    console.error(' Login failed:', authError.message)
    console.log('  First create this demo user on your live site!')
    return
  }

  console.log(' Logged in:', authData.user.email)

  // Clear old data
  await supabase.from('evaluations').delete().eq('user_id', authData.user.id)

  const evaluations = []
  const data = [
    { prompt: 'What is machine learning?', response: 'ML is a subset of AI that learns from data...' },
    { prompt: 'Explain quantum computing', response: 'Quantum computing uses quantum mechanics...' },
    { prompt: 'How does blockchain work?', response: 'Blockchain is a distributed ledger...' },
    { prompt: 'What is AI?', response: 'AI simulates human intelligence...' },
    { prompt: 'Describe neural networks', response: 'Neural networks are inspired by biological neurons...' }
  ]

  for (let i = 0; i < 50; i++) {
    const daysAgo = Math.floor(Math.random() * 14)
    const date = new Date()
    date.setDate(date.getDate() - daysAgo)

    const item = data[i % data.length]

    evaluations.push({
      user_id: authData.user.id,
      interaction_id: `prod_${Date.now()}_${i}`,
      prompt: item.prompt,
      response: item.response,
      score: parseFloat((Math.random() * 0.3 + 0.7).toFixed(2)),
      latency_ms: Math.floor(Math.random() * 400 + 150),
      flags: [],
      pii_tokens_redacted: 0,
      created_at: date.toISOString()
    })
  }

  const { error } = await supabase.from('evaluations').insert(evaluations)

  if (error) {
    console.error(' Error:', error.message)
  } else {
    console.log(' Inserted 50 evaluations for demo account\n')
  }
}

seedProduction()