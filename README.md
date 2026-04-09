# HireIQ — Agentic RAG Hiring Platform

> Production-grade AI hiring platform that screens 500+ resumes in minutes, not days.

**Built with the 1+99 philosophy — full production, zero shortcuts, zero cost.**

---

## What Is HireIQ?

HireIQ is a two-pipeline agentic RAG system that automates the most painful part of recruiting — resume screening. Upload a ZIP of 500+ resumes and a job description. HireIQ scores every resume using semantic vector embeddings, shortlists the top N candidates, and runs a deep 4-iteration AI agent analysis on each shortlisted resume — generating a complete evaluation report and 9 bespoke interview questions per candidate. Everything is stored in Supabase and displayed on a live recruiter dashboard.

---

## The Problem It Solves

A recruiter receiving 500 resumes for a single role faces 40+ hours of manual screening. Keyword-based ATS systems miss great candidates. Generic AI tools produce shallow, one-size-fits-all evaluations.

HireIQ solves all three:

- **Speed** — 500 resumes processed in minutes via vector similarity scoring
- **Accuracy** — Gemini's 3072-dimensional semantic embeddings capture meaning, not just keywords
- **Depth** — A 4-iteration ReAct agent produces evaluations that rival a trained human reviewer
- **Cost** — Entirely on free tiers. $0/month. Forever.

---

## Architecture Overview

<img width="1536" height="1024" alt="image" src="https://github.com/user-attachments/assets/f12afe01-4e42-410b-a58d-bc3b41f6c713" />

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Workflow Engine | n8n self-hosted · localhost:5678 | Pipeline orchestration |
| LLM | Groq · llama-3.3-70b-versatile | Agent reasoning + interview questions |
| Embeddings | Gemini · gemini-embedding-001 | 3072-dimensional semantic vectors |
| Vector DB | Supabase pgvector | Chunk storage + cosine similarity search |
| Database | Supabase PostgreSQL | Jobs, candidates, evaluations, logs |
| File Storage | Supabase Storage | PDF hosting with public URLs |
| Frontend | React 18 + Vite + Tailwind CSS | Recruiter dashboard UI |
| Decompression | inflate-server.js · Express | DEFLATE ZIP bypass for n8n vm2 sandbox |

---

## Features

### Pipeline 1 — Bulk Shortlist

- Accepts ZIP files containing 500+ resume PDFs
- Parses ZIP Central Directory for accurate decompression (handles data descriptor ZIPs)
- DEFLATE decompression via local inflate-server (bypasses n8n vm2 sandbox restrictions)
- Uploads all PDFs to Supabase Storage instantly
- Embeds each resume with Gemini's 3072-dim model
- Computes cosine similarity against the job description embedding
- Ranks all candidates and shortlists top N
- Triggers Pipeline 2 for each shortlisted candidate automatically

### Pipeline 2 — Deep Analysis

- Section-aware semantic chunking (Skills, Experience, Projects, Education independently)
- Stores all chunks with embeddings in Supabase pgvector
- Retrieves top 8 most relevant chunks via pgvector cosine search
- Runs 4-iteration focused ReAct agent loop:
  - **Iteration 1** — Skills assessment
  - **Iteration 2** — Experience match
  - **Iteration 3** — Gap identification + strengths
  - **Iteration 4** — Final synthesis + recommendation
- Generates 9 tailored interview questions (3 technical, 3 behavioral, 3 scenario-based)
- Caches results — same candidate + same JD = instant cached response
- Exponential backoff retry on rate limits (5s → 15s → 45s)
- Stagger delay prevents simultaneous Groq calls from concurrent executions

### Recruiter Dashboard

- Real-time polling every 4 seconds
- Shortlisted candidates section with live evaluation cards
- Non-shortlisted candidates section with resume links only
- Cards update from ANALYZING → HIRE / INTERVIEW / REJECT as evaluations complete
- Split view: PDF iframe + full evaluation panel per candidate
- Approve / Reject actions with Supabase status update
- Export evaluation to PDF

---

## Database Schema

```sql
-- One row per bulk upload run
jobs (
  id uuid PK,
  title text,
  job_description text,
  jd_hash text unique,
  max_shortlist int,
  created_at timestamp
)

-- One row per resume processed
candidates (
  candidate_id text PK,
  job_id uuid FK → jobs,
  full_text text,
  file_name text,
  file_url text,
  shortlist_score float,
  status text,   -- scored | shortlisted | evaluated | approved | rejected
  created_at timestamp
)

-- Vector store — one row per text chunk
resume_chunks (
  id uuid PK,
  candidate_id text FK → candidates,
  chunk_index int,
  section_type text,
  text text,
  embedding vector(3072),
  unique(candidate_id, chunk_index)
)

-- One full evaluation per candidate
evaluations (
  candidate_id text PK FK → candidates,
  skills_match_score int,
  experience_match_score int,
  missing_skills jsonb,
  strengths jsonb,
  recommendation text,   -- hire | interview | reject
  confidence text,       -- high | medium | low
  reasoning_trace jsonb,
  evidence jsonb,
  interview_questions jsonb,
  agent_meta jsonb,
  created_at timestamp
)

-- Non-blocking error logging
error_logs (
  id uuid PK,
  pipeline text,
  node_name text,
  candidate_id text,
  error_message text,
  error_detail jsonb,
  created_at timestamp
)

-- API key authentication
api_keys (key_hash text PK, created_at timestamp)
```

---

## The Mathematics

HireIQ uses **cosine similarity** to score every resume against the job description:
cos(θ) = (A · B) / (‖A‖ × ‖B‖)

Where `A` is the resume embedding and `B` is the JD embedding — both 3072-dimensional vectors from Gemini.

**Why cosine and not dot product or Euclidean?**

Embedding magnitudes vary with text length. Cosine normalises for magnitude, measuring only directional (topical) similarity. A short resume and a long resume covering the same skills produce equal cosine scores — which is the correct semantic behaviour.

**Real scores from a live test run:**

| Candidate | Profile | Score | Outcome |
|---|---|---|---|
| Sahith Phiradi | MERN + ML + IoT + Blockchain | 0.667 | ✅ HIRE |
| Phiradi Sai Sandeep | MERN full stack | 0.622 | 🎯 INTERVIEW |
| Pothina Manasa Sree | Python + ML, no MERN | 0.619 | ❌ Not shortlisted |

---

## The Agentic Loop

Instead of one LLM call that produces shallow results, HireIQ runs a 4-iteration ReAct loop where each iteration has a single focused task:
Iteration 1: OBSERVE resume chunks → THINK "What skills match?"       → partial_results.skills
Iteration 2: OBSERVE + prior       → THINK "What experience matches?" → partial_results.experience
Iteration 3: OBSERVE + prior       → THINK "What's missing?"          → partial_results.gaps
Iteration 4: OBSERVE all prior     → THINK "Synthesise everything"    → final_output + recommendation

The agent scratchpad accumulates across iterations. By iteration 4, the model synthesises from three complete prior analyses — producing evaluation depth comparable to a trained human reviewer.

---

## Key Engineering Decisions

### The inflate-server Problem

n8n's Code nodes run inside `vm2` — a sandboxed Node.js VM that blocks `require()` for native modules including `zlib`. Standard ZIP files use DEFLATE compression which requires `zlib` to decompress. Solution: `inflate-server.js` — a 40-line Express server that runs outside the sandbox on port 3001, receives compressed bytes via HTTP, decompresses with native `zlib`, and returns raw PDF bytes.

### Central Directory ZIP Parsing

Most ZIP parsers read sizes from local file headers — but Windows and Python's `zipfile` write `0` there when using data descriptors, storing real sizes after the compressed data. HireIQ reads the ZIP **Central Directory** at the end of the file, which always has correct sizes and offsets regardless of data descriptor usage.

### JD Embedding Cache

For 500 resumes sharing the same job description, calling Gemini 500 times for the same JD wastes quota. The JD embedding is cached in n8n's `$getWorkflowStaticData('global')` keyed by `jobId` — computed once, reused for every candidate in the same run.

### Section-Aware Chunking

Resume sections carry fundamentally different semantic content. Mixing Skills text with Education text in a single chunk degrades retrieval quality. HireIQ detects section boundaries via regex and chunks each section independently — ensuring Skills chunks are never mixed with Education chunks during pgvector retrieval.

### Rate Limit Protection

Two mechanisms protect against Groq 429 errors at scale:

- **Stagger delay** — on iteration 1, each candidate waits `hash(candidate_id[-1]) % 5 × 3000ms` before calling Groq, spreading concurrent executions across 0–12 seconds
- **Exponential backoff** — on 429 or 503, retries at 5s → 15s → 45s before failing

---

## Getting Started

### Prerequisites

- Node.js 18+
- n8n self-hosted (`npm install -g n8n`)
- Supabase account (free tier)
- Groq API key (free tier — groq.com)
- Gemini API key (free tier — ai.google.dev)

### 1. Clone the repository

```bash
git clone https://github.com/sahith215/HireIQ.git
cd HireIQ
```

### 2. Set up Supabase

Run the SQL from `supabase/schema.sql` in your Supabase SQL Editor. This creates all tables, the `match_resume_chunks` RPC function, and the resumes storage bucket.

### 3. Configure environment variables

```bash
cp frontend/.env.example frontend/.env
```

Fill in `frontend/.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_API_KEY=hireiq_prod_key_sahith
VITE_N8N_URL=http://localhost:5678
```

### 4. Start the inflate server

```bash
node inflate-server.js
```

Keep this terminal open whenever running HireIQ.

### 5. Start n8n

```bash
npx n8n start
```

Import `workflows/HireIQ_Pipeline_1.json` and `workflows/HireIQ_Pipeline_2.json`. Activate both workflows.

### 6. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`

### One-click startup (Windows)

```bash
start-hireiq.bat
```

Starts both the inflate server and n8n in separate terminals automatically.

---

## Project Structure

<img width="1536" height="1024" alt="image" src="https://github.com/user-attachments/assets/2f395b9c-0a81-461b-a09b-6c55794a7fdf" />

---

## Evaluation Output

Every evaluated candidate gets a full structured report:

```json
{
  "success": true,
  "candidate_id": "cand_el0hox",
  "evaluated_at": "2026-04-07T00:44:19.105Z",
  "evaluation": {
    "skills_match_score": 9,
    "experience_match_score": 8,
    "missing_skills": ["AWS", "Google Cloud"],
    "strengths": ["MERN Stack", "TensorFlow", "IoT", "Blockchain"],
    "recommendation": "hire",
    "confidence": "high",
    "reasoning_trace": ["Iteration 1: ...", "Iteration 2: ...", "Iteration 3: ..."],
    "evidence": [{ "claim": "...", "quote": "...", "section": "skills" }]
  },
  "interview_questions": {
    "technical": [{ "question": "...", "rationale": "...", "expected_signal": "..." }],
    "behavioral": [...],
    "scenario_based": [...]
  },
  "agent_meta": {
    "iterations_used": 4,
    "max_iterations": 4,
    "retrieval_stats": { "total": 8, "returned": 8, "top_score": 0.762 }
  }
}
```

---

## Rate Limits & Free Tier Usage

| Service | Free Limit | HireIQ Usage Per Run (500 resumes, top_n=20) |
|---|---|---|
| Groq | 14,400 req/day · 6,000 TPM | ~100 calls (5 per shortlisted candidate) |
| Gemini | 1,500 req/day · 100 RPM | ~600 calls (1 per chunk + 1 per JD) |
| Supabase DB | 500MB | ~12KB per candidate |
| Supabase Storage | 1GB | ~100KB per PDF |

---

## Interviewer Assessment

> *"This project demonstrates genuine understanding of agentic systems, not just API wrappers. The candidate clearly understands retrieval, iteration, caching, and production constraints. The zero-cost architecture shows resourcefulness."*

| Dimension | Score |
|---|---|
| Agentic Architecture | 8.5 / 10 |
| RAG Implementation | 8.0 / 10 |
| Pipeline Engineering | 9.0 / 10 |
| System Design | 8.0 / 10 |
| Code Quality | 7.0 / 10 |
| **Overall** | **8.1 / 10** |

*Verdict: Strong Hire for junior-to-mid AI Engineer role.*

---

## Author

**Sahith Phiradi**
BTech Computer Science 2027 · Lendi Institute of Engineering and Technology · Vizag, India

- GitHub: [@sahith215](https://github.com/sahith215)
- Email: sahith305@gmail.com
- LinkedIn: [linkedin.com/in/sahith-phiradi-5b2808290](https://linkedin.com/in/sahith-phiradi-5b2808290)
