import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Validate required fields
    const { interaction_id, prompt, response, score, latency_ms } = body
    
    if (!interaction_id || !prompt || !response || score === undefined || !latency_ms) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Insert evaluation
    const { data, error } = await supabase
      .from('evaluations')
      .insert({
        user_id: session.user.id,
        interaction_id,
        prompt,
        response,
        score: parseFloat(score),
        latency_ms: parseInt(latency_ms),
        flags: body.flags || [],
        pii_tokens_redacted: body.pii_tokens_redacted || 0
      })
      .select()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to insert evaluation' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}