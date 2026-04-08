<![CDATA[<div align="center">

# ⚡ HireIQ

### AI-Powered Hiring Intelligence Platform

**Evaluate resumes, shortlist top talent, and get deep candidate insights — all in seconds.**

[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![n8n](https://img.shields.io/badge/n8n-Agentic_RAG-EA4B71?style=for-the-badge&logo=n8n&logoColor=white)](https://n8n.io/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

</div>

---

## 📌 Overview

**HireIQ** is a production-grade, AI-driven hiring evaluator built for modern recruiting teams. It uses an **Agentic RAG (Retrieval-Augmented Generation)** pipeline — powered by n8n workflow automation — to intelligently parse, score, and rank resumes against a given job description with near-human accuracy.

Whether you're screening a single candidate or running bulk shortlisting across hundreds of resumes in a ZIP archive, HireIQ delivers structured evaluation reports in real time, persisted to Supabase and surfaced through a dynamic, animated dashboard.

> Built for **speed**, **scale**, and **signal** — so recruiters can focus on people, not paperwork.

---

## ✨ Key Features

### 🎯 Single Resume Evaluation
- Upload any **PDF resume** and paste a **job description**
- The agentic n8n pipeline extracts skills, experience, and context
- Returns a structured evaluation: **Skills Match Score**, **Experience Match Score**, **Recommendation** (`HIRE / INTERVIEW / MAYBE / REJECT`), and **Confidence** level
- Results rendered in a rich, animated panel with score breakdowns

### 📦 Bulk Shortlist Mode
- Upload a **ZIP archive** of multiple resumes at once
- Specify how many top candidates you need (up to 50)
- AI pipeline processes every resume asynchronously and writes results to Supabase
- Immediately redirected to a **real-time dashboard** that polls Supabase every 4 seconds

### 📊 Real-Time Bulk Dashboard
- Live polling dashboard at `/dashboard/:job_id`
- Candidates split into **Shortlisted** and **Not Shortlisted** sections automatically
- Animated score progress bars for **Skills Match** and **Experience Match**
- Recommendation badges: `HIRE`, `INTERVIEW`, `MAYBE`, `REJECT`
- Polling auto-stops when all shortlisted candidates are fully evaluated
- **Connection-lost detection** with retry logic after 3 consecutive failures

### 🧠 Full Candidate Profile Page
- Deep-dive view at `/candidate/:candidate_id`
- Full AI-generated evaluation: strengths, weaknesses, detailed recommendation rationale
- Back navigation preserves job session context via `localStorage`

### 🩺 n8n Health Badge
- Live health check indicator on the Evaluate page
- Reads from `VITE_N8N_URL` — works in both dev and production environments
- Color-coded animated dot: **amber (checking)** → **green (online)** → **red (offline)**

### 🎨 Premium UI/UX
- Dark-mode glassmorphism design system
- **Framer Motion** micro-animations and page transitions
- **GSAP + ScrollTrigger** animations on the landing page
- **Lenis** smooth-scroll for buttery-smooth inertia scrolling
- Fully responsive layout — desktop-first with mobile support

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Vite + React)                   │
│  Landing Page → /evaluate → /dashboard/:job_id → /candidate/:id  │
│              Hosted on Vercel (static)                           │
└──────────────────┬──────────────────────────┬────────────────────┘
                   │ POST /webhook/*           │ REST API
                   ▼                           ▼
┌──────────────────────────┐    ┌──────────────────────────────────┐
│     n8n Workflow Engine   │    │         Supabase (PostgreSQL)    │
│  - resume_upload webhook  │───▶│  candidates table                │
│  - bulk_shortlist webhook │    │  evaluations table               │
│  Agentic RAG pipeline:    │    │  (anon key — public read/write)  │
│  Parse → Embed → Score    │    └──────────────────────────────────┘
│  → Recommend → Persist    │
└──────────────────────────┘
           │
┌──────────▼───────────────┐
│  Backend Proxy (Express)  │
│  /api/evaluate            │
│  Hosted on Render         │
└───────────────────────────┘
```

### Data Flow

1. **Single Mode:** `Frontend → POST /webhook/resume_upload (n8n) → AI Pipeline → Supabase → Response JSON → Frontend`
2. **Bulk Mode:** `Frontend → POST /webhook/bulk_shortlist (n8n) → Async AI Pipeline → Supabase → Frontend polls every 4s`

---

## 🗂️ Project Structure

```
HireIQ/
├── backend/
│   ├── server.js              # Express proxy server — forwards uploads to n8n
│   ├── .env.example           # Backend environment template
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx            # Router, GSAP/Lenis init, lazy-loaded routes
│   │   ├── main.jsx
│   │   ├── index.css          # Global design system (CSS custom properties)
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx        # Marketing landing page
│   │   │   ├── EvaluatePage.jsx       # Single + bulk upload UI
│   │   │   ├── DashboardPage.jsx      # Real-time bulk results dashboard
│   │   │   └── CandidatePage.jsx      # Full candidate evaluation profile
│   │   └── components/
│   │       ├── evaluate/
│   │       │   ├── UploadPanel.jsx    # File upload, mode switcher, submit
│   │       │   └── ResultsPanel.jsx   # Evaluation results renderer
│   │       ├── landing/
│   │       │   ├── Navbar.jsx
│   │       │   ├── HowItWorks.jsx
│   │       │   └── ...
│   │       └── ui/
│   │           ├── ScrollProgress.jsx
│   │           └── ErrorBoundary.jsx
│   ├── .env.example           # Frontend environment template
│   └── vite.config.js         # Dev proxy: /webhook → n8n, /api → backend
│
├── inflate-server.js          # DEFLATE decompression utility (local ZIP handling)
├── render.yaml                # Render deployment configuration
├── .gitignore                 # Excludes .env, node_modules, dist
└── package.json               # Root scripts: install:all, build, start
```

---

## ⚙️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend Framework** | React 18 + Vite 5 | SPA with code-splitting and lazy loading |
| **Styling** | Tailwind CSS 3 + Vanilla CSS | Design tokens, glassmorphism, dark mode |
| **Animations** | Framer Motion + GSAP | Page transitions, micro-animations, scroll effects |
| **Smooth Scroll** | Lenis (`@studio-freight/lenis`) | Inertia-based smooth scrolling |
| **Routing** | React Router v6 | Client-side routing with dynamic params |
| **Charts** | Recharts | Score visualization |
| **Backend Proxy** | Node.js + Express | Forwards multipart file uploads to n8n |
| **Workflow Engine** | n8n | Agentic RAG pipeline (PDF parse → AI score → persist) |
| **Database** | Supabase (PostgreSQL) | Persists candidate and evaluation records |
| **Deployment (FE)** | Vercel | Static hosting for the React build |
| **Deployment (BE)** | Render | Node.js proxy server |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **npm** v9 or higher
- A running **n8n** instance (local or cloud) with the `resume_upload` and `bulk_shortlist` webhooks configured
- A **Supabase** project with `candidates` and `evaluations` tables

---

### 1. Clone the Repository

```bash
git clone https://github.com/sahith215/HireIQ.git
cd HireIQ
```

### 2. Install Dependencies

```bash
npm run install:all
```

This installs dependencies for both `frontend/` and `backend/`.

---

### 3. Configure Environment Variables

#### Backend (`backend/.env`)

Copy the template and fill in your values:

```bash
cp backend/.env.example backend/.env
```

```env
# n8n Webhook URL — your n8n instance's resume_upload webhook
N8N_URL=http://localhost:5678/webhook/resume_upload

# App Environment
NODE_ENV=development
PORT=3001
```

#### Frontend (`frontend/.env`)

```bash
cp frontend/.env.example frontend/.env
```

```env
# Supabase project URL and anon key (from Supabase → Settings → API)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# API key expected by your n8n webhook header authentication
VITE_API_KEY=your_api_key_here

# Public n8n URL (used for health checks — defaults to localhost in dev)
VITE_N8N_URL=http://localhost:5678
```

---

### 4. Run Locally

**Start both servers (separate terminals):**

```bash
# Terminal 1 — Backend proxy
cd backend && npm run dev

# Terminal 2 — Frontend dev server
cd frontend && npm run dev
```

Or from the root:

```bash
npm run dev:backend   # Starts Express on :3001
npm run dev:frontend  # Starts Vite on :5173
```

The frontend Vite dev server proxies:
- `/api/*` → `http://localhost:3001`
- `/webhook/*` → `http://localhost:5678` (n8n)

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🗄️ Supabase Schema

Ensure your Supabase project has the following tables:

### `candidates`

| Column | Type | Description |
|---|---|---|
| `candidate_id` | `uuid` | Primary key |
| `job_id` | `text` | Groups candidates from the same bulk job |
| `file_name` | `text` | Original resume filename |
| `file_url` | `text` | Public URL of the stored PDF |
| `shortlist_score` | `float` | Vector similarity score (0–100) |
| `status` | `text` | `pending`, `shortlisted`, `evaluated`, `approved`, `rejected` |

### `evaluations`

| Column | Type | Description |
|---|---|---|
| `candidate_id` | `uuid` | FK → `candidates.candidate_id` |
| `skills_match_score` | `float` | Score out of 10 |
| `experience_match_score` | `float` | Score out of 10 |
| `recommendation` | `text` | `HIRE`, `INTERVIEW`, `MAYBE`, or `REJECT` |
| `confidence` | `text` | `HIGH`, `MEDIUM`, or `LOW` |

---

## 🌐 Deployment

### Frontend → Vercel

1. Push to GitHub (already done ✅)
2. Import the repository in [Vercel](https://vercel.com/new)
3. Set **Root Directory** to `frontend`
4. Add all environment variables in **Vercel → Settings → Environment Variables**:

| Variable | Value |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `VITE_API_KEY` | Your webhook API key |
| `VITE_N8N_URL` | Your public n8n instance URL |

5. Deploy!

---

### Backend → Render

1. In [Render](https://render.com), create a new **Web Service**
2. Connect your GitHub repo
3. Set **Root Directory** to `backend`
4. **Build Command:** `npm install`
5. **Start Command:** `node server.js`
6. Add environment variables in Render dashboard:

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | `3001` |
| `N8N_URL` | Full n8n webhook URL |

> **Note:** The `render.yaml` at the repo root handles all of this declaratively — Render will detect and use it automatically.

---

## 🔒 Security

- **`.env` files are gitignored** — no secrets are ever committed to version control
- **Supabase anon key** is safe to expose in the frontend by design — it only provides access controlled by Supabase Row Level Security (RLS) policies
- **Webhook API key** (`VITE_API_KEY`) is validated by n8n's Header Auth node
- All sensitive values are injected at **build time via Vite** (`import.meta.env.VITE_*`) or at **runtime via Node.js** (`process.env.*`)
- CORS on the backend proxy is locked to known origins in production

---

## 📝 API Reference

### `POST /api/evaluate`
Proxy endpoint — forwards a single resume + job description to n8n.

**Request:** `multipart/form-data`

| Field | Type | Required | Description |
|---|---|---|---|
| `data` | `File` | ✅ | Resume PDF |
| `job_description` | `string` | ✅ | Full job description text |

**Response:** JSON evaluation object from the n8n pipeline.

---

### `GET /health`
Health check endpoint.

**Response:**
```json
{ "status": "ok", "message": "HireIQ proxy server is running" }
```

---

## 📦 Available Scripts

### Root
```bash
npm run install:all     # Install dependencies for frontend + backend
npm run dev:frontend    # Start Vite dev server
npm run dev:backend     # Start Express proxy server
npm run build           # Build frontend for production
npm start               # Start backend server (production)
```

### Frontend
```bash
npm run dev             # Vite dev server on :5173
npm run build           # Build to frontend/dist/
npm run preview         # Preview production build locally
```

---

## 🛣️ Routes

| Route | Page | Description |
|---|---|---|
| `/` | Landing Page | Marketing page with feature overview |
| `/evaluate` | Evaluate Page | Single resume upload or bulk ZIP upload |
| `/dashboard/:job_id` | Dashboard Page | Real-time bulk evaluation tracking |
| `/candidate/:candidate_id` | Candidate Page | Full AI-generated candidate profile |

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

Please follow [Conventional Commits](https://www.conventionalcommits.org/) for commit messages.

---

## 📄 License

This project is licensed under the **MIT License**.

---

<div align="center">

**Built with ❤️ by [Sahith](https://github.com/sahith215)**

*HireIQ — Hire smarter, not harder.*

</div>
]]>
