# AI Agent Evaluation Framework

A Next.js application for tracking and evaluating AI agent performance with multi-tenant support.

## Features

- 🔐 User Authentication (Supabase Auth)
- 📊 Dashboard with performance metrics and trends
- ⚙️ Configurable evaluation settings
- 🔒 Row-Level Security (RLS)
- 📈 Charts and visualizations
- 🌱 Seed script for test data
- 🔌 API endpoint for evaluation ingestion

## Tech Stack

- **Frontend:** Next.js 15, React, Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** Supabase (PostgreSQL)
- **Charts:** Recharts
- **Authentication:** Supabase Auth

## Setup Instructions

### 1. Clone Repository
```bash
git clone <your-repo-url>
cd ai-eval-tracker
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables

Create `.env.local` file:
```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Database Setup

Run this SQL in Supabase SQL Editor:
```sql
-- Users settings table
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  run_policy TEXT DEFAULT 'always' CHECK (run_policy IN ('always', 'sampled')),
  sample_rate_pct INTEGER DEFAULT 100 CHECK (sample_rate_pct >= 0 AND sample_rate_pct <= 100),
  obfuscate_pii BOOLEAN DEFAULT false,
  max_eval_per_day INTEGER DEFAULT 1000,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Evaluations table
CREATE TABLE evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  interaction_id TEXT NOT NULL,
  prompt TEXT NOT NULL,
  response TEXT NOT NULL,
  score DECIMAL(3,2) CHECK (score >= 0 AND score <= 1),
  latency_ms INTEGER,
  flags TEXT[],
  pii_tokens_redacted INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_evaluations_user_id ON evaluations(user_id);
CREATE INDEX idx_evaluations_created_at ON evaluations(created_at DESC);

-- RLS Policies
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings"
  ON user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own evaluations"
  ON evaluations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own evaluations"
  ON evaluations FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### 5. Run Development Server
```bash
npm run dev
```

Visit `http://localhost:3000`

### 6. Generate Test Data
```bash
npm run seed
```

Enter your email and password when prompted.

## Database Schema

### `user_settings`
- `id`: UUID (Primary Key)
- `user_id`: UUID (Foreign Key to auth.users)
- `run_policy`: TEXT ('always' or 'sampled')
- `sample_rate_pct`: INTEGER (0-100)
- `obfuscate_pii`: BOOLEAN
- `max_eval_per_day`: INTEGER
- `created_at`: TIMESTAMPTZ
- `updated_at`: TIMESTAMPTZ

### `evaluations`
- `id`: UUID (Primary Key)
- `user_id`: UUID (Foreign Key to auth.users)
- `interaction_id`: TEXT
- `prompt`: TEXT
- `response`: TEXT
- `score`: DECIMAL (0.00-1.00)
- `latency_ms`: INTEGER
- `flags`: TEXT[]
- `pii_tokens_redacted`: INTEGER
- `created_at`: TIMESTAMPTZ

## API Endpoints

### POST `/api/evals/ingest`

Ingest new evaluation data.

**Headers:**
```
Cookie: sb-access-token=<your-token>
```

**Body:**
```json
{
  "interaction_id": "int_123",
  "prompt": "What is AI?",
  "response": "AI is...",
  "score": 0.85,
  "latency_ms": 250,
  "flags": ["flagged"],
  "pii_tokens_redacted": 2
}
```

**Response:**
```json
{
  "success": true,
  "data": { ... }
}
```

## Row-Level Security (RLS)

All tables have RLS enabled. Users can only:
- View their own data
- Insert their own data
- Update their own settings

RLS is enforced at the database level using Supabase policies.

## Performance

- Handles 20,000+ evaluation rows
- Pagination implemented for large datasets
- Indexed queries for fast retrieval
- Efficient date-range filtering

## Deployment

Deploy to Vercel:
```bash
vercel deploy
```

Add environment variables in Vercel dashboard.

## Test Credentials

Create a test user via the signup page or use:
- Email: `test@test.com`
- Password: `test1234`

## License

MIT