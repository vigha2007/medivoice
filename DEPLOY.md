# Deploying MediVoice to Render

This repo includes a `render.yaml` "Blueprint" that provisions three things
in one go:

- `medivoice-backend` — Flask API (Python web service)
- `medivoice-frontend` — React app (static site)
- `medivoice-db` — Postgres database (free tier)

## 1. Push to GitHub

Render deploys from a Git repo, so push this project (with the fixes
applied) to a new GitHub repository first.

```bash
cd MediVoice
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<you>/medivoice.git
git push -u origin main
```

## 2. Create the Blueprint on Render

1. Go to https://dashboard.render.com → **New** → **Blueprint**
2. Connect your GitHub repo
3. Render will detect `render.yaml` and show the 3 resources above —
   click **Apply**

Render will generate `SECRET_KEY` and `JWT_SECRET_KEY` automatically and
wire the Postgres `DATABASE_URL` into the backend for you.

## 3. Fix the cross-service URLs (one-time, after first deploy)

The `render.yaml` guesses your service URLs as `medivoice-backend` and
`medivoice-frontend`, but Render may assign different subdomains
depending on availability. After the first deploy:

1. Copy the actual backend URL from its Render dashboard page
   (e.g. `https://medivoice-backend-xyz1.onrender.com`)
2. On the **frontend** service → Environment → set
   `VITE_API_URL` to `<backend-url>/api`, then trigger a manual redeploy
   (env var changes require a rebuild for static sites)
3. Copy the actual frontend URL
4. On the **backend** service → Environment → set `CORS_ORIGINS` to
   that frontend URL, then it will restart automatically

## 4. Known limitations on the free tier

- **Free web services spin down after ~15 min of inactivity** and take
  ~30-60s to wake on the next request. This also pauses the
  `APScheduler` background job in `reminder.py` that sweeps missed
  doses — it only runs while the service is awake. For always-on
  reminder sweeping, upgrade the backend to a paid instance type.
- **Free Postgres databases on Render expire after 30 days** unless
  upgraded — fine for testing, not for a real deployment.
- pyttsx3 (server-side TTS in `routes/voice_routes.py`) uses `espeak-ng`
  on Linux. Render's Python runtime doesn't include it by default; if
  `/api/voice/speak` (or equivalent) 500s in production, you'll need a
  Docker-based deploy instead so you can `apt-get install espeak-ng` in
  the image. The in-browser Web Speech API fallback will still work
  either way.

## 5. Local development (unchanged)

```bash
# backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python app.py          # http://localhost:5000

# frontend
cd frontend
npm install
npm run dev             # http://localhost:5173, proxies /api to :5000
```
