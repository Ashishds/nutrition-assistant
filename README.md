# NutriBot – Nutrition RAG + Sleek Chat UI (Next.js)

A Retrieval-Augmented Generation (RAG) project that ingests a nutrition PDF into Supabase and serves a minimal, OpenAI‑style chat experience (Next.js App Router) with citations and subtle UI polish.

## Features
- RAG pipeline with OpenAI embeddings + Supabase RPC retrieval
- Minimal, sleek chat UI with loading dots, sounds, and clickable citations
- ARC Prize–inspired theme (clean typography, dark/light, smooth transitions)
- Vercel‑ready (Next.js 15 App Router)

## Repository Layout
```
NutriBot/
├── ingest.py                 # PDF → chunks → embeddings → Supabase
├── test_embeddings.py        # Retrieval sanity checks (RPC)
├── requirements.txt          # Python deps
├── rag-chat/                 # Next.js app (frontend + /api/chat)
│   ├── package.json
│   ├── next.config.ts
│   ├── tsconfig.json
│   ├── eslint.config.mjs
│   ├── postcss.config.mjs
│   ├── public/
│   └── src/app/
│       ├── api/chat/route.ts # Chat API: retrieve + call OpenAI
│       ├── globals.css       # Theme + animations
│       ├── layout.tsx
│       └── page.tsx          # Chat UI (typing, citations, sounds)
└── .gitignore                # Global ignores (env, caches, builds, etc.)
```

## 1) Requirements
- Python 3.10+ (Windows/macOS/Linux)
- Node.js 18+ (LTS recommended)
- Supabase project with the `match_documents` RPC
- OpenAI API Key

Environment variables (create a `.env` in repo root):
```
OPENAI_API_KEY=your_openai_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```
Never commit secrets. `.env` files are ignored by `.gitignore`.

## 2) Python Setup
```powershell
# From repo root
python -m pip install --upgrade pip
pip install -r requirements.txt
```

## 3) Ingest the PDF (one‑time)
Place your PDF alongside `ingest.py` (for example `human-nutrition-text.pdf`) and update `ingest.py` paths if needed. Then:
```powershell
python ingest.py
```
This will:
- Read and chunk the PDF
- Embed with OpenAI
- Insert rows into Supabase (table your RPC reads from)

Quick retrieval test:
```powershell
python test_embeddings.py
```

## 4) Run the Web App Locally
```powershell
cd rag-chat
npm install
npm run dev
# open http://localhost:3000
```

## 5) Deploy to Vercel (CLI)
```powershell
cd rag-chat
vercel login
vercel link --yes

# Add env vars to Vercel (paste values when prompted)
vercel env add OPENAI_API_KEY
vercel env add SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY

# Deploy
vercel --prod
```

## Notes
- Do not commit the source PDF to Git. Keep it local or host separately.
- If you change env vars on Vercel, redeploy (`vercel --prod`).
- The chat API runs on the server via Next.js `app/api/chat/route.ts` and never exposes service role keys to the browser.

## License
MIT
