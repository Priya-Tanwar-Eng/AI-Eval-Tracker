const { createClient } = require('@supabase/supabase-js')
const readline = require('readline')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query) {
  return new Promise(resolve => rl.question(query, resolve))
}

async function seed() {
  console.log('🌱 Starting seed...\n')

  // Ask for credentials
  const email = await question('Enter your email: ')
  const password = await question('Enter your password: ')
  
  console.log('\nLogging in...')

  // Login
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password: password.trim()
  })

  if (authError) {
    console.error('❌ Login failed:', authError.message)
    rl.close()
    return
  }

  console.log('✅ Logged in as:', authData.user.email)

  // Generate 100 evaluations over the last 14 days
  const evaluations = []
  const prompts = [
    'What is machine learning?',
    'Explain quantum computing',
    'How does blockchain work?',
    'What is artificial intelligence?',
    'Describe neural networks',
    'What is deep learning?',
    'Explain natural language processing',
    'How do transformers work?',
    'What is computer vision?',
    'Describe reinforcement learning'
  ]

  const responses = [
    'Machine learning is a subset of AI that enables systems to learn from data...',
    'Quantum computing uses quantum mechanics principles like superposition...',
    'Blockchain is a distributed ledger technology that ensures transparency...',
    'AI is the simulation of human intelligence in machines...',
    'Neural networks are computing systems inspired by biological neural networks...',
    'Deep learning uses multiple layers to progressively extract features...',
    'NLP enables computers to understand and process human language...',
    'Transformers use attention mechanisms to process sequential data...',
    'Computer vision enables machines to interpret visual information...',
    'Reinforcement learning trains agents through rewards and penalties...'
  ]

  console.log('\n📊 Generating 100 evaluations over the last 14 days...\n')

  for (let i = 0; i < 100; i++) {
    const daysAgo = Math.floor(Math.random() * 14)
    const date = new Date()
    date.setDate(date.getDate() - daysAgo)
    date.setHours(Math.floor(Math.random() * 24))
    date.setMinutes(Math.floor(Math.random() * 60))

    const score = (Math.random() * 0.4 + 0.6).toFixed(2) // 0.6 to 1.0
    const hasPii = Math.random() > 0.9

    evaluations.push({
      user_id: authData.user.id,
      interaction_id: `int_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`,
      prompt: prompts[i % prompts.length],
      response: responses[i % responses.length],
      score: parseFloat(score),
      latency_ms: Math.floor(Math.random() * 500 + 100), // 100-600ms
      flags: Math.random() > 0.85 ? ['accuracy_concern'] : [],
      pii_tokens_redacted: hasPii ? Math.floor(Math.random() * 5 + 1) : 0,
      created_at: date.toISOString()
    })
  }

  // Insert in batches
  const batchSize = 20
  let successCount = 0

  for (let i = 0; i < evaluations.length; i += batchSize) {
    const batch = evaluations.slice(i, i + batchSize)
    const { error } = await supabase
      .from('evaluations')
      .insert(batch)

    if (error) {
      console.error('❌ Error inserting batch:', error.message)
    } else {
      successCount += batch.length
      process.stdout.write(`\r✅ Inserted: ${successCount}/${evaluations.length} evaluations`)
    }
  }

  console.log('\n\n🎉 Seed completed successfully!')
  console.log(`📈 Total evaluations inserted: ${successCount}`)
  console.log('\n💡 Refresh your dashboard to see the data!\n')

  rl.close()
}

seed().catch(error => {
  console.error('❌ Seed failed:', error)
  rl.close()
  process.exit(1)
})