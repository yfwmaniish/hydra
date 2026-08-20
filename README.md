# Trinetra (HYDRA)

Trinetra ("third eye") is a threat intelligence platform aimed at Indian critical infrastructure — government portals, banking/UPI, defense, energy, telecom, and healthcare. It continuously pulls posts from public sources (Reddit's security subreddits, Pastebin, and arbitrary forum URLs), runs them through a regex- and keyword-based detection pipeline to flag credential leaks and attack-planning discussion, scores each hit for severity and credibility, and surfaces the results on a live dashboard. `HYDRA` is the working name of the overall project/repository; the two components inside it — `trinetra-backend` and `trinetra-main-frontend` — are what actually ship. There is no code in this repo referencing a separate "Trinetra 3.0" backend project; the only trace of that name is the Firebase project id (`trinetra-intel-v3`) used for the Firestore database.

This started as a hackathon-style build (see `HYDRApdf.pdf` and the `TRINETRA_*.md` notes in the repo root, which are pitch/architecture material written alongside the code) and the codebase backs up most of what that material claims: async scraping, a hybrid regex+keyword detection engine, WebSocket push to the frontend, and optional AI-generated summaries and Telegram/email escalation. A few things described as ambitions in those docs — GeoIP-based location enrichment, full-text search — are stubbed or explicitly left as "integrate later" in code comments and are called out below rather than presented as finished features.

## What it actually does

- **Scrapes three kinds of sources on a timer** (`trinetra-backend/app/crawler/engine.py`, default every 300s): Reddit's public `.json` API for a fixed list of security subreddits (no auth needed), Pastebin's scraping API with a BeautifulSoup archive-page fallback, and a generic forum scraper that walks admin-configured URLs using configurable CSS selectors.
- **Detects leaked credentials with ~20 regex patterns** (`app/crawler/credential_detector.py`): AWS/Google/Azure keys, Stripe/GitHub/Slack/Discord tokens, private key blocks, database connection strings, JWTs, plus India-specific identifiers (Aadhaar-shaped numbers, PAN, phone numbers, bank account + IFSC context). Matches are partially redacted before being stored. Admins can add custom regex patterns through a Firestore config document, and they're picked up on the next crawl cycle.
- **Classifies text with keyword/regex matching, not ML** (`app/nlp/analyzer.py`): dictionaries of attack-related terms (ransomware, RCE, C2, lateral movement, etc.), credential-leak phrasing, and per-sector keyword lists for seven Indian sectors (Government, Banking & Finance, Defense, Energy & Power, Telecom, Healthcare, Transportation). A negative-keyword filter suppresses obvious job postings/tutorials so "penetration testing internship" doesn't get flagged. The module's docstring mentions TF-IDF, but there's no scikit-learn dependency anywhere in `requirements.txt` or the code — the actual matching is regex word-boundary lookups, not a trained model.
- **Scores every hit 0–100** (`app/nlp/threat_scorer.py`): up to 50 points from the NLP result (severity weight, confidence, keyword variety, sector-targeting bonus) and up to 50 from credential matches (severity-weighted), then buckets into Low/Medium/High/Critical. A separate 0–100 "credibility" score estimates how likely the hit is a genuine threat versus noise. Anything scoring under 20 is dropped before it ever reaches Firestore.
- **Stores and streams results**: qualifying threats are written to a Firestore `threats` collection (deduplicated by source URL) and pushed immediately to connected clients over a WebSocket (`app/routers/websocket.py`); Critical/High threats also fire an async Telegram alert if a bot token/chat id is configured.
- **Builds an entity relationship graph on demand** (`app/routers/entities.py`): rather than persisting a separate graph, it extracts actors, target sectors, IPs, and domains straight out of stored threat records (via regex) each time `/api/entities` is called, merges that with any manually seeded entities, and lays out node positions radially for the frontend's investigation view.
- **Computes sector "health"** (`app/routers/sectors.py`): six fixed sectors start at 100 and lose points per threat that targets them (Critical −18, High −12, Medium −6, Low −2), landing in Critical/Warning/Stable status bands — unless a `sectors` collection has been manually seeded, in which case that data wins.
- **Optional AI summaries and escalation**: `/api/threats/{id}/analyze` calls OpenRouter (default model `google/gemini-2.0-flash-001`) for a short tactical summary of a threat, falling back to a canned heuristic string if no API key is set or the call fails. `/api/threats/{id}/escalate` sends an SMTP email formatted like an incident report and marks the threat `Escalated`.
- **Auth is Firebase-based but only partially enforced**: the backend exposes `/api/auth/login` (email/password against the Firebase Identity Toolkit REST API) and verifies Firebase ID tokens via the Admin SDK on `/api/auth/me`. The frontend, however, signs users in directly against Firebase Auth using Google sign-in through the client SDK (`AuthContext.tsx`) rather than the backend's login endpoint. Every other API route (`threats`, `sources`, `keywords`, `sectors`, `stats`, `entities`) is currently open — none of them apply the `get_current_user` dependency.
- **Seeds itself on first boot** (`app/utils/seed.py`): if the `threats`/`entities`/`sectors`/`sources`/`keywords` collections are empty, the app writes a small set of example records so the dashboard isn't blank on a fresh Firebase project.
- **Frontend has a live-with-fallback data layer** (`trinetra-main-frontend/src/services/threatService.ts`): every dashboard call tries the real backend API first and silently falls back to static mock data (`src/data/mockData.ts`) if the request fails, so the UI stays demoable even with the backend down.

## Architecture

```
Reddit (.json API) ─┐
Pastebin (scrape API/archive) ─┼─▶ CrawlerEngine (asyncio loop, every N seconds)
Generic forum URLs ─┘                 │
                                       ▼
                     CredentialDetector + NLPAnalyzer ──▶ threat_scorer (0-100)
                                       │
                                score >= 20?
                                       │
                                       ▼
                         Firestore "threats" collection
                                       │
                        ┌──────────────┼───────────────────┐
                        ▼              ▼                    ▼
                 WebSocket push   Telegram alert      AI summary / SMTP
                 (/ws)            (Critical/High)      escalation (on demand)
                        │
                        ▼
             React dashboard (trinetra-main-frontend)
             — falls back to mock data if the API is unreachable
```

The backend is a single FastAPI process: `app/main.py` initializes Firebase Admin, runs the Firestore seed check, and starts the crawler loop as a background `asyncio` task in the app's lifespan handler — there's no separate worker process or task queue. The frontend is a standalone Vite/React SPA that talks to the backend over REST + WebSocket and to Firebase Auth directly for login.

## Tech stack

**Backend** (`trinetra-backend/`, Python 3.10+, see `requirements.txt`):
- FastAPI 0.115 + Uvicorn — HTTP API and ASGI server
- `firebase-admin` 6.7 — Firestore access and ID token verification
- `httpx` — async HTTP client used by all scrapers, OpenRouter, and Telegram calls
- `beautifulsoup4` + `lxml` — HTML parsing for the Pastebin archive fallback and generic forum scraper
- `pydantic` / `pydantic-settings` — request/response schemas and `.env`-driven config (`app/config.py`)
- No ML/NLP libraries (no scikit-learn, spaCy, transformers, etc.) — detection is entirely regex/dictionary-based

**Frontend** (`trinetra-main-frontend/`, package name `sentinel` in `package.json`):
- React 19 + TypeScript, built with Vite
- Tailwind CSS
- Firebase JS SDK (Auth — Google sign-in)
- `@tanstack/react-query`, `react-router-dom`, `framer-motion`, `lucide-react`

**Data / infra**:
- Firebase Firestore as the only database (`firestore.rules`, `firestore.indexes.json`, `firebase.json` target `asia-south1`)
- Firebase Hosting for the built frontend (`trinetra-main-frontend/firebase.json`)
- A `Dockerfile` for the backend (Python 3.11-slim, runs `uvicorn` on port 8080, matching Cloud Run's default)

## Repository layout

```
trinetra-backend/
├── app/
│   ├── main.py               # FastAPI app, lifespan (Firebase init, seed, crawler start/stop)
│   ├── config.py              # pydantic-settings, reads .env
│   ├── firebase_client.py     # Firebase Admin init, Firestore client, token verification
│   ├── crawler/
│   │   ├── engine.py           # orchestrates scrapers -> analysis -> storage -> broadcast
│   │   ├── base_scraper.py     # RawPost dataclass + BaseScraper interface
│   │   ├── credential_detector.py
│   │   └── scrapers/           # reddit_scraper.py, pastebin_scraper.py, generic_scraper.py
│   ├── nlp/
│   │   ├── analyzer.py         # keyword/regex threat classification
│   │   └── threat_scorer.py    # combines NLP + credential results into a 0-100 score
│   ├── routers/                # auth, threats, entities, sectors, sources, keywords, stats, websocket
│   ├── schemas/                # pydantic request/response models
│   ├── services/                # ai_service.py (OpenRouter), telegram_service.py, escalation_service.py
│   └── utils/                   # security.py (auth dependency), seed.py (initial data)
├── firebase.json / firestore.rules / firestore.indexes.json
├── requirements.txt / Dockerfile / .env.example
└── debug_firestore.py, debug_graph.py, reset_data.py, get_chat_id.py, test_*.py   # ad hoc dev/debug scripts, not a test suite

trinetra-main-frontend/
├── src/
│   ├── pages/          # Dashboard, Investigation, AlertDetail, AdminConfig, Login, Profile
│   ├── components/     # UI components (ui/ subfolder), UserProfileMenu
│   ├── services/        # api.ts (HTTP client), threatService.ts (API-with-mock-fallback)
│   ├── context/          # AuthContext (Firebase), ThemeContext, TranslationContext
│   ├── data/mockData.ts # fallback/demo data
│   └── config/firebase.ts
├── firebase.json / .firebaserc   # Firebase Hosting config
└── package.json (name: "sentinel")
```

## Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- A Firebase project with Firestore enabled, plus a downloaded service account JSON key (Firebase Console → Project Settings → Service Accounts → Generate new private key)

### Backend

```bash
cd trinetra-backend
python -m venv .venv
.venv\Scripts\activate        # or: source .venv/bin/activate on macOS/Linux

pip install -r requirements.txt

cp .env.example .env
# then edit .env — see variable reference below
# place your Firebase service account JSON where FIREBASE_SERVICE_ACCOUNT_PATH points

python -m uvicorn app.main:app --reload
```

The API comes up on `http://localhost:8000` with interactive docs at `/docs`. On first startup it initializes Firebase, seeds Firestore if the collections are empty, and starts the background crawler loop. If Firebase credentials aren't configured yet, startup logs a warning but the server still comes up (Firestore-backed endpoints will simply fail until it's configured).

Note: `.env.example` names the credentials variable `FIREBASE_SERVICE_ACCOUNT_PATH`, but `app/config.py` actually reads it as `firebase_service_account_key` (default `serviceAccountKey.json`). Since pydantic-settings matches env vars case-insensitively by field name, set `FIREBASE_SERVICE_ACCOUNT_KEY=<path>` in your `.env`, not `FIREBASE_SERVICE_ACCOUNT_PATH`.

### Frontend

```bash
cd trinetra-main-frontend
npm install
cp .env.example .env
# set VITE_API_URL and VITE_WS_URL to point at the backend above
npm run dev
```

### Docker (backend only)

```bash
cd trinetra-backend
docker build -t trinetra-backend .
docker run -p 8080:8080 --env-file .env trinetra-backend
```

## Configuration reference

Backend `.env` (see `trinetra-backend/app/config.py` for the full list and defaults):

| Variable | Purpose |
| --- | --- |
| `FIREBASE_API_KEY` | Firebase Web API key, used for the `/api/auth/login` REST call |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Path to the Firebase service account JSON (Admin SDK) |
| `HOST` / `PORT` | Uvicorn bind address (defaults `0.0.0.0:8000`) |
| `CRAWLER_INTERVAL_SECONDS` | Time between crawl cycles (default 300) |
| `GEMINI_API_KEY` / `OPENROUTER_API_KEY` | Optional — enables `/threats/{id}/analyze` AI summaries via OpenRouter; without a key, a heuristic string is returned instead |
| `SMTP_SERVER` / `SMTP_PORT` / `SMTP_USERNAME` / `SMTP_PASSWORD` | Optional — enables the `/threats/{id}/escalate` email step |
| `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` | Optional — enables Telegram alerts for Critical/High threats |
| `CORS_ORIGINS` | Comma-separated allowed origins (defaults include `localhost:5173`, `localhost:3000`) |

Frontend `.env`:

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | Backend REST base URL (default `http://localhost:8000/api`) |
| `VITE_WS_URL` | Backend WebSocket URL (default `ws://localhost:8000/ws`) |

## Notable technical decisions and current limitations

- **Firestore rules are still in test mode.** `firestore.rules` is the default Firebase scaffold — it allows any client to read and write the entire database until a hardcoded expiry date. This needs real security rules (or reliance on the backend + Admin SDK as the only write path) before this touches any real data.
- **Most API routes have no auth check.** Only `/api/auth/me` uses the `get_current_user` dependency; `threats`, `sources`, `keywords`, `sectors`, `stats`, and `entities` are open to anyone who can reach the backend.
- **Search is in-memory.** `/api/threats/search` fetches every threat document and filters client-side in Python rather than using a search index — noted in the code as fine for a prototype, not for scale.
- **The timeline endpoint pads real data with random noise** (`/api/threats/timeline` in `threats.py`) — bucket counts are clamped to a minimum random value "for visual interest" if there's little real activity, so the chart isn't a pure reflection of stored threats.
- **The frontend never truly requires a live backend.** `threatService.ts` wraps every API call in a try/fallback that returns static mock data on failure, which is convenient for demos but means a broken backend fails silently in the UI rather than surfacing an error.
- **AI and escalation features degrade gracefully.** Both the OpenRouter integration and the Telegram/SMTP alerting are optional — missing keys don't break the app, they just fall back to heuristic text or a no-op with a logged warning.
- **Location/GeoIP enrichment is a stub.** Threat documents have a `location` field (lat/lng/name) in the schema, but nothing in the crawler populates it — the code comment literally says "Could be enriched with GeoIP later."

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Open a pull request against `main`
