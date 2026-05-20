# Running Locally in VS Code (Next.js + Python)

Your application has been converted to a **Next.js (App Router)** frontend and a **Python (FastAPI)** backend.

## 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18.17 or later)
- [Python 3.9+](https://www.python.org/)
- Export your code from AI Studio.

## 2. Setup

### Backend (Python)
In a terminal at the root:
```bash
pip install -r requirements.txt
```

### Frontend (Next.js)
In a second terminal:
```bash
cd frontend
npm install
```

## 3. Environment Variables
Create `.env` files with your Supabase credentials:

**Root `.env` (for Backend):**
```env
SUPABASE_URL=your_url
SUPABASE_ANON_KEY=your_key
```

**`frontend/.env.local` (for Frontend if needed direct access, though it proxies):**
```env
SUPABASE_URL=your_url
SUPABASE_ANON_KEY=your_key
```

---

## 4. How to Run

### Option A: Concurrent Start (Recommended)
From the **root** folder:
```bash
npm run dev
```
- **Backend:** Starts on `http://localhost:8000`
- **Frontend:** Starts on `http://localhost:3000`
- **Proxy:** Next.js automatically proxies requests from `localhost:3000/api` to `localhost:8000/api`.

### Option B: Separate Processes
**Terminal 1 (Backend):**
```bash
python backend/main.py
```
**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

---

## 5. Deployment Guide

### Deploying the Frontend (Next.js)
The best place to deploy the frontend is **Vercel** (the creators of Next.js):
1. Push your code to GitHub.
2. Sign in to [Vercel](https://vercel.com).
3. Import your repository.
4. Set the **Root Directory** to `frontend`.
5. Add your `SUPABASE_URL` and `SUPABASE_ANON_KEY` as Environment Variables.

### Deploying the Backend (Python FastAPI)
You can use **Render** or **Railway**:
1. Create a new "Web Service" on [Render](https://render.com).
2. Connect your GitHub repo.
3. Set **Start Command** to `python backend/main.py` or use a production server: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`.
4. Add your environment variables in the Render dashboard.

*Note: Since they are on different domains in production, ensure the Next.js `rewrites` or `fetch` calls are updated to point to the deployed Backend URL.*
