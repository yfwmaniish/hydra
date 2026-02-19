# Trinetra — Complete System Architecture & Threat Detection Deep Dive

> **Purpose**: A judge-ready, end-to-end explanation of how every component in Trinetra works, especially how threats are detected, scored, classified, and displayed in real-time.

---

## 1. What is Trinetra?

Trinetra is a **Web Forum Threat Intelligence Scraper & Analyzer** that monitors cybersecurity forums, paste sites, and web sources to detect threats targeting **Indian critical infrastructure**. It detects leaked credentials, attack planning discussions, and data exposures — then scores, classifies, and displays them in a real-time dashboard with live WebSocket alerts.

```mermaid
graph LR
    A["🌐 Data Sources"] --> B["🕷️ Crawler Engine"]
    B --> C["🔍 Credential Detector"]
    B --> D["🧠 NLP Analyzer"]
    C --> E["📊 Threat Scorer"]
    D --> E
    E --> F["🔥 Firestore"]
    E --> G["⚡ WebSocket"]
    F --> H["🖥️ Dashboard"]
    G --> H
```

---

## 2. System Architecture Overview

The system has **3 layers**:

| Layer | Tech Stack | Purpose |
|-------|-----------|---------|
| **Frontend** | React + TypeScript + Vite | Real-time dashboard, alert viewer, admin config |
| **Backend** | FastAPI (Python) + Uvicorn | Crawler engine, NLP analysis, API endpoints |
| **Database** | Firebase Firestore | Persistent storage for threats, config, users |

### Project Structure

```
TRINETRA/
├── trinetra-backend/          # Python FastAPI backend
│   ├── app/
│   │   ├── main.py            # FastAPI app entry point
│   │   ├── config.py          # Environment settings
│   │   ├── firebase_client.py # Firebase Admin SDK
│   │   ├── crawler/           # Data collection layer
│   │   │   ├── engine.py      # ★ THE HEART — orchestrator
│   │   │   ├── credential_detector.py  # Regex credential scanner
│   │   │   ├── base_scraper.py         # Abstract scraper interface
│   │   │   └── scrapers/
│   │   │       ├── reddit_scraper.py     # Reddit JSON API
│   │   │       ├── pastebin_scraper.py   # Pastebin scraping API
│   │   │       └── generic_scraper.py    # CSS-based web scraper
│   │   ├── nlp/               # Analysis layer
│   │   │   ├── analyzer.py    # Keyword + sector + entity detection
│   │   │   └── threat_scorer.py  # Unified 0-100 scoring
│   │   ├── routers/           # API endpoints
│   │   │   ├── threats.py, websocket.py, auth.py, etc.
│   │   ├── schemas/           # Pydantic data models
│   │   └── utils/
│   │       └── seed.py        # Initial demo data
│   └── serviceAccountKey.json # Firebase credentials
│
└── trinetra-main-frontend/    # React TypeScript frontend
    └── src/
        ├── pages/
        │   ├── Dashboard.tsx       # Main threat dashboard
        │   ├── AlertDetail.tsx     # Individual threat details
        │   ├── AdminConfig.tsx     # System configuration
        │   ├── Investigation.tsx   # Threat investigation tools
        │   └── Login.tsx           # Firebase Authentication
        └── services/
            ├── api.ts              # HTTP client to backend
            └── threatService.ts    # Service layer + mock fallback
```

---

## 3. Application Startup Sequence

When you run the backend (`uvicorn app.main:app`), this happens in order:

```mermaid
sequenceDiagram
    participant U as Uvicorn
    participant M as main.py
    participant FB as Firebase
    participant S as Seed Utility
    participant CE as Crawler Engine

    U->>M: Start FastAPI app
    M->>FB: initialize_firebase()
    Note over FB: Load serviceAccountKey.json<br/>Connect to Firestore
    M->>S: seed_initial_data()
    Note over S: Check if collections are empty<br/>If empty → insert demo threats,<br/>entities, sectors, sources, keywords
    M->>CE: get_engine() → engine.start()
    Note over CE: Create background asyncio task<br/>Start crawl loop (every 300s)
    M-->>U: App is ready on port 8000
```

Key details:
- **Firebase**: Initialized using a service account key JSON file. This gives the backend **admin-level access** to Firestore (no user auth needed server-side).
- **Seed Data**: 5 demo threats, 6 entities, 6 entity links, 7 sectors, 6 sources, and 8 keywords are inserted if the database is empty — so the dashboard never appears blank on first run.
- **Crawler Engine**: Starts as a background task using `asyncio.create_task()`. It runs independently from the main API server.

---

## 4. The Crawler Engine — The Heart of the System

File: [engine.py](file:///d:/Projects/Trinetra/TRINETRA/trinetra-backend/app/crawler/engine.py)

The Crawler Engine is a **singleton background service** that orchestrates the entire intelligence pipeline in a loop.

### 4.1 Crawl Cycle (Every 5 Minutes)

```mermaid
flowchart TD
    A["⏱️ Crawl Cycle Starts"] --> B["1. Refresh Config from Firestore"]
    B --> C["2. Scrape All Sources in Parallel"]
    C --> D{Posts found?}
    D -->|No| E["Log 'No posts' → Sleep 300s"]
    D -->|Yes| F["3. For EACH post:"]
    F --> G["a. Run Credential Detection"]
    G --> H["b. Run NLP Analysis"]
    H --> I{Is it a threat?}
    I -->|No| J["Skip post"]
    I -->|Yes| K["c. Calculate Threat Score"]
    K --> L{Score ≥ 20?}
    L -->|No| J
    L -->|Yes| M{Is it a duplicate?}
    M -->|Yes| J
    M -->|No| N["d. Store in Firestore"]
    N --> O["e. Broadcast via WebSocket"]
    O --> E
```

### 4.2 Step 1: Config Refresh

At the start of every cycle, the engine **re-reads** all configuration from Firestore:

| What It Loads | From Firestore Collection | Used By |
|---|---|---|
| Active keywords (e.g., "india cyber attack") | `keywords` collection | NLP Analyzer |
| Custom regex patterns | `config/credential_patterns` | Credential Detector |
| Active source URLs | `sources` collection | Generic Forum Scraper |

This means **admins can change the config from the frontend, and the crawler picks it up within 5 minutes** without restart.

### 4.3 Step 2: Parallel Scraping

Three scrapers run **simultaneously** using `asyncio.gather()`:

---

## 5. The Three Scrapers

### 5.1 Reddit Scraper
File: [reddit_scraper.py](file:///d:/Projects/Trinetra/TRINETRA/trinetra-backend/app/crawler/scrapers/reddit_scraper.py)

| Aspect | Details |
|--------|---------|
| **API** | Reddit's public `.json` endpoint (no API key needed) |
| **URL Pattern** | `https://www.reddit.com/r/{subreddit}/new.json?limit=15` |
| **Subreddits Monitored** | `netsec`, `cybersecurity`, `hacking`, `ReverseEngineering`, `InfoSecNews` |
| **Posts per sub** | 15 newest posts |
| **Content Combined** | `title + \n\n + selftext` (title and body merged for analysis) |

### 5.2 Pastebin Scraper
File: [pastebin_scraper.py](file:///d:/Projects/Trinetra/TRINETRA/trinetra-backend/app/crawler/scrapers/pastebin_scraper.py)

| Aspect | Details |
|--------|---------|
| **Primary API** | `https://scrape.pastebin.com/api_scraping.php` |
| **Fallback** | Scrapes `pastebin.com/archive` page with BeautifulSoup |
| **Max pastes** | 20 per cycle |
| **Content limit** | First 5000 characters per paste |
| **Why Pastebin?** | Attackers frequently dump credentials and data here |

### 5.3 Generic Forum Scraper
File: [generic_scraper.py](file:///d:/Projects/Trinetra/TRINETRA/trinetra-backend/app/crawler/scrapers/generic_scraper.py)

| Aspect | Details |
|--------|---------|
| **Method** | BeautifulSoup HTML parsing with CSS selectors |
| **Default Selectors** | `article, .post, .thread, .message, .entry` |
| **URLs** | Loaded dynamically from Firestore `sources` collection |
| **Fallback** | If no CSS containers found, extracts all visible page text |
| **Max posts per URL** | 25 |
| **Purpose** | Admin can add any forum URL via the dashboard |

### Common Output: RawPost

Every scraper produces `RawPost` objects:

```python
@dataclass
class RawPost:
    content: str            # The text body to analyze
    title: str = ""         # Post title
    author: str = "Unknown" # Author name
    url: str = ""           # Source URL
    timestamp: str = ""     # ISO 8601 timestamp
    source_name: str = ""   # e.g., "Reddit r/netsec"
```

---

## 6. Credential Detector — Regex-Based Secret Scanner

File: [credential_detector.py](file:///d:/Projects/Trinetra/TRINETRA/trinetra-backend/app/crawler/credential_detector.py)

This is the **first analysis pass** on every scraped post. It scans the raw text using **24+ pre-compiled regex patterns** to find leaked secrets.

### 6.1 Pattern Categories

| Category | Patterns | Severity | Examples |
|----------|----------|----------|----------|
| **Cloud Keys** | AWS Access/Secret Key, Google API Key, Azure Key | Critical/High | `AKIAIOSFODNN7EXAMPLE` |
| **API Tokens** | Stripe, GitHub, Slack, Discord tokens | Critical/High | `ghp_xxxx`, `sk_[live]_xxx` |
| **Private Keys** | RSA, SSH, PGP private key headers | Critical | `-----BEGIN RSA PRIVATE KEY-----` |
| **Database URLs** | MongoDB, Postgres, MySQL, Redis conn strings | Critical | `postgres://admin:pass@host:5432/db` |
| **JWT Tokens** | Base64 JSON Web Tokens | High | `eyJhbG...` |
| **🇮🇳 India-Specific** | Aadhaar numbers, PAN numbers, Indian phone numbers, Indian bank accounts | Critical/High/Medium | `2345 6789 0123`, `ABCDE1234F` |
| **Env Variables** | SECRET_KEY, DATABASE_URL assignments | High | `SECRET_KEY=abc123` |
| **Passwords** | Password field assignments | High | `password=mySecret` |

### 6.2 How Credential Detection Works

```mermaid
flowchart TD
    A["Input: Raw post content"] --> B["Loop over 24+ compiled regex patterns"]
    B --> C{Match found?}
    C -->|Yes| D["Extract matched value"]
    D --> E["Get 50-char context around match"]
    E --> F["Partially redact value for storage"]
    F --> G["Create CredentialMatch object"]
    G --> B
    C -->|No| B
    B --> H["Deduplicate by type+value"]
    H --> I["Return list of CredentialMatch"]
```

### 6.3 Redaction Logic

Values are partially hidden for safe storage:
- Short values (≤8 chars): Show first 2 chars → `AB***`
- Longer values: Show first 1/3 (max 6) + last 3 → `AKIAIO***PLE`

### 6.4 Custom Patterns

Admins can add their own regex patterns through the AdminConfig page. These are stored in Firestore at `config/credential_patterns` and loaded every crawl cycle. Lines starting with `#` are treated as comments.

### 6.5 CredentialMatch Output

```python
@dataclass
class CredentialMatch:
    type: str          # e.g., "AWS Key", "Aadhaar"
    value: str         # Partially redacted matched string
    severity: str      # Critical, High, Medium, Low
    pattern_name: str  # Which regex pattern matched
    context: str       # 200-char surrounding text for evidence
```

---

## 7. NLP Analyzer — Keyword & Contextual Threat Detection

File: [analyzer.py](file:///d:/Projects/Trinetra/TRINETRA/trinetra-backend/app/nlp/analyzer.py)

The NLP Analyzer is the **second analysis pass**. It examines the text for cybersecurity threat language, India-specific targeting, and extracts entities.

### 7.1 Five-Phase Analysis Pipeline

```mermaid
flowchart TD
    A["Input: Raw post content"] --> B["Phase 1: Attack Keyword Detection"]
    B --> C["Phase 2: Credential Keyword Detection"]
    C --> D["Phase 3: Custom Keyword Matching"]
    D --> E["Phase 4: India Sector Targeting"]
    E --> F["Phase 5: Entity Extraction"]
    F --> G{Any keywords matched?}
    G -->|No| H["Return: is_threat=False"]
    G -->|Yes| I["Determine Threat Type"]
    I --> J["Determine Severity"]
    J --> K["Calculate Confidence"]
    K --> L["Apply India-specific severity boosts"]
    L --> M["Return: ThreatIndicator"]
```

### 7.2 Phase 1: Attack Keywords (30 terms)

These identify **attack planning discussions**:

| Keyword | Assigned Severity |
|---------|------------------|
| `ransomware`, `zero-day`, `backdoor`, `rootkit`, `c2 server`, `rce`, `data exfiltration`, `supply chain attack`, `apt` | **Critical** |
| `ddos`, `exploit`, `payload`, `botnet`, `malware`, `trojan`, `sql injection`, `privilege escalation`, `lateral movement`, `spear phishing` | **High** |
| `brute force`, `xss` | **Medium** |

### 7.3 Phase 2: Credential Keywords (19 terms)

These identify **credential leak discussions**:

| Keyword | Assigned Severity |
|---------|------------------|
| `leaked password`, `password dump`, `credential dump`, `combolist`, `plaintext password`, `username:password`, `email:pass`, `database leak`, `data breach`, `aws key`, `private key`, `ssh key exposed` | **Critical** |
| `api key leak`, `exposed api`, `config leak`, `.env file`, `github secret`, `password list` | **High** |

### 7.4 Phase 3: Custom Keywords

Admin-configured keywords from the AdminConfig page. Loaded from Firestore `keywords` collection. All custom keywords are assigned **Medium** severity by default.

### 7.5 Phase 4: India Sector Targeting Detection

This is what makes Trinetra **India-focused**. It checks for mentions of Indian critical infrastructure sectors:

| Sector | Detection Keywords |
|--------|--------------------|
| **Government** | `nic.in`, `gov.in`, `aadhaar`, `digilocker`, `umang`, `uidai`, `irctc`, `epfo`, `ministry` |
| **Banking & Finance** | `sbi`, `icici`, `hdfc`, `rbi`, `upi`, `bhim`, `paytm`, `razorpay`, `neft`, `rtgs`, `imps` |
| **Defense** | `drdo`, `isro`, `indian army/navy/air force`, `bsf`, `crpf`, `nsg`, `raw`, `hal` |
| **Energy & Power** | `ntpc`, `bpcl`, `iocl`, `ongc`, `power grid`, `tata power`, `nuclear power` |
| **Telecom** | `airtel`, `jio`, `bsnl`, `trai`, `5g india` |
| **Healthcare** | `aiims`, `cowin`, `aarogya setu`, `icmr`, `apollo`, `fortis` |
| **Transportation** | `indian railways`, `irctc`, `nhai`, `air india`, `metro rail` |

### 7.6 Phase 5: Entity Extraction (Simplified NER)

Uses regex patterns to pull out **Indicators of Compromise (IOCs)**:

| Entity Type | Regex Pattern | Example |
|-------------|---------------|---------|
| **IP Addresses** | `\b(?:\d{1,3}\.){3}\d{1,3}\b` | `IP:45.33.49.119` |
| **Email Addresses** | RFC-style email regex | `Email:admin@gov.in` |
| **Domain Names** | TLD-aware domain regex (.com, .in, .gov.in, etc.) | `Domain:nic.gov.in` |
| **URLs** | `https?://...` | `URL:https://malicious.com/payload` |

### 7.7 Threat Type Classification

Based on which keyword categories had matches:

| Condition | Threat Type |
|-----------|-------------|
| Credential keywords matched | `"Credential Leak"` |
| Attack keywords matched (no credential keywords) | `"Attack Planning"` |
| Only custom keywords matched | `"Suspicious Activity"` |

### 7.8 Severity Determination

1. **Base**: Take the **highest severity** from all matched keywords
2. **India boost**: If an Indian sector is mentioned AND severity is Medium → upgrade to **High**
3. **Double boost**: If Indian sector is mentioned AND severity is High AND credential keywords matched → upgrade to **Critical**

### 7.9 Confidence Score Calculation (0.0 to 0.99)

This numeric confidence measures **how likely this is a real threat**, not a false positive:

| Factor | Points Added | Cap |
|--------|-------------|-----|
| Each keyword match | +0.08 | Max 0.40 |
| 3+ unique keywords matched | +0.10 | — |
| Each Indian sector detected | +0.15 | Max 0.45 (3 sectors) |
| Each entity found (IP, email, domain) | +0.05 | Max 0.20 (4 entities) |
| Content length > 500 chars | +0.05 | — |
| Content length > 2000 chars | +0.05 | — |
| **Maximum possible** | **0.99** | Hard cap |

### 7.10 ThreatIndicator Output

```python
@dataclass
class ThreatIndicator:
    is_threat: bool
    threat_type: str           # "Credential Leak", "Attack Planning", etc.
    severity: str              # Critical, High, Medium, Low
    confidence: float          # 0.0 to 0.99
    matched_keywords: list[str]
    entities_found: list[str]  # IPs, emails, domains, URLs
    target_sector: str         # "Government", "Banking & Finance", etc.
```

---

## 8. Threat Scorer — The Unified 0-100 Score

File: [threat_scorer.py](file:///d:/Projects/Trinetra/TRINETRA/trinetra-backend/app/nlp/threat_scorer.py)

This module **combines** the outputs from both the NLP Analyzer and the Credential Detector into a single, unified threat assessment. This is the **final decision-making step** before storing a threat.

### 8.1 Score Calculation Formula

The score is a **0-100 integer** built from two halves:

```mermaid
graph TD
    subgraph "NLP Contribution (max 50 pts)"
        A["Severity Points<br/>Critical=30, High=22.5, Med=15, Low=7.5"] --> E["Sum"]
        B["Confidence × 10<br/>(max 10 pts)"] --> E
        C["Keyword count × 1<br/>(max 5 pts)"] --> E
        D["Sector targeting<br/>(5 pts if detected)"] --> E
    end
    subgraph "Credential Contribution (max 50 pts)"
        F["Per credential:<br/>Critical=15, High=11.25,<br/>Med=7.5, Low=3.75"] --> G["Sum (capped at 50)"]
    end
    E --> H["Total Score<br/>(capped at 100)"]
    G --> H
```

### 8.2 Detailed Scoring Breakdown

#### NLP Contribution (Maximum 50 points)

| Component | Formula | Max Points |
|-----------|---------|------------|
| **Severity base** | `SEVERITY_WEIGHTS[severity] × 30` | 30 |
| | Critical → `1.0 × 30 = 30` | |
| | High → `0.75 × 30 = 22.5` | |
| | Medium → `0.5 × 30 = 15` | |
| | Low → `0.25 × 30 = 7.5` | |
| **Confidence bonus** | `confidence × 10` | 10 |
| **Keyword variety** | `min(keyword_count × 1.0, 5.0)` | 5 |
| **Sector targeting** | `5.0` if sector detected | 5 |

#### Credential Contribution (Maximum 50 points)

For **each** credential match found:

| Credential Severity | Points per Match |
|---------------------|-----------------|
| Critical | `1.0 × 15 = 15.0` |
| High | `0.75 × 15 = 11.25` |
| Medium | `0.5 × 15 = 7.5` |
| Low | `0.25 × 15 = 3.75` |

*Total credential points are capped at 50.*

### 8.3 Score → Severity Mapping

| Score Range | Severity Level |
|-------------|---------------|
| **80-100** | 🔴 **Critical** |
| **60-79** | 🟠 **High** |
| **35-59** | 🟡 **Medium** |
| **0-34** | 🟢 **Low** |

> **Override Rule**: If either the NLP result or any credential match has a "Critical" or "High" severity, and that's higher than what the score alone would give — the override wins. This prevents a low-score threat with a Critical credential from being labeled "Low".

### 8.4 Credibility Score (0-100)

A separate **credibility** score measures "how confident are we this is real, not a false positive":

| Factor | Points |
|--------|--------|
| **Base** | 30 |
| NLP confidence | `confidence × 25` (max 25) |
| 3+ keyword matches | +10 |
| 5+ keyword matches | +10 |
| Any credential patterns found | +15 |
| Critical-severity credentials found | +10 |
| Indian sector targeted | +5 |
| Entities (IPs, domains) found | +5 |
| **Maximum** | **99** |

### 8.5 Threat Type Classification

| Condition | Result |
|-----------|--------|
| Credentials found + NLP says "Credential Leak" | `"Credential Leak"` |
| Credentials found + NLP says something else | `"Credential Exposure + {NLP type}"` |
| No credentials, NLP-only detection | Whatever NLP returned |

### 8.6 Detail Summary Generation

A human-readable summary is built showing:
- `"Matched keywords: ddos, ransomware, backdoor"`
- `"Credentials found: AWS Key, Private Key"`
- `"Targets: Government"`
- `"Entities: IP:45.33.49.119, Domain:nic.gov.in"`

### 8.7 Worked Example

> **Scenario**: A Pastebin paste contains "Leaked credential dump from SBI internet banking portal. aws_secret_access_key = ABCD1234... Also found admin@sbi.co.in password list."

**Credential Detector finds**:
- AWS Secret Key (Critical, +15 pts)
- Password assignment (High, +11.25 pts)
- = **26.25 credential points**

**NLP Analyzer finds**:
- Keywords: `credential dump` (Critical), `password list` (High), `data breach` — 3 matches
- Severity: Critical (highest keyword)
- Sector: "Banking & Finance" (matched "sbi")
- Entities: `Email:admin@sbi.co.in`, `Domain:sbi.co.in`
- Confidence: 0.08×3 + 0.15 + 0.05×2 = 0.59
- NLP base: `1.0 × 30 = 30` + `0.59 × 10 = 5.9` + `3 × 1.0 = 3.0` + `5.0 = 5.0` = **43.9 NLP points**

**Total Score**: `43.9 + 26.25 = 70.15` → **70** → **High severity**

**Override check**: NLP has "Critical" severity → Override to **Critical**

**Credibility**: `30 + (0.59×25=14.75) + 10 + 15 + 10 + 5 + 5 = 89`

**Final Result**:
- Score: **70**
- Severity: **Critical** (overridden)
- Credibility: **89%**
- Type: `"Credential Leak"`
- Summary: `"Matched keywords: credential dump, password list, data breach; Credentials found: AWS Secret, Password; Targets: Banking & Finance; Entities: Email:admin@sbi.co.in, Domain:sbi.co.in"`

---

## 9. Threat Storage & Deduplication

### 9.1 Duplicate Check

Before storing, the engine checks if **a threat with the same URL already exists** in Firestore:

```python
existing = db.collection("threats").where("url", "==", post.url).limit(1).get()
```

If found → skip the post entirely.

### 9.2 Threat ID Generation

Each threat gets a unique ID:

```
THR-{YYYYMMDD}-{SHA256_HASH[:12]}
```

Where the hash is based on: `source_name:url:title`

Example: `THR-20260219-A3B8D1E2F4C6`

### 9.3 Threat Document Structure (Stored in Firestore)

```json
{
    "id": "THR-20260219-A3B8D1E2F4C6",
    "title": "Credential dump detected on dark web forum",
    "source": "Pastebin",
    "target": "Banking & Finance",
    "type": "Credential Leak",
    "severity": "Critical",
    "credibility": 89,
    "timestamp": "2026-02-19T00:30:00Z",
    "status": "New",
    "rawEvidence": "First 2000 chars of original content...",
    "details": "Matched keywords: credential dump, ...; Credentials: AWS Key...",
    "location": null,
    "url": "https://pastebin.com/abc123",
    "matched_keywords": ["credential dump", "password list"],
    "credential_types": ["AWS Secret", "Password"],
    "entities_found": ["Email:admin@sbi.co.in", "Domain:sbi.co.in"]
}
```

---

## 10. Real-Time WebSocket Broadcast

File: [websocket.py](file:///d:/Projects/Trinetra/TRINETRA/trinetra-backend/app/routers/websocket.py)

When a new threat is stored, it is **immediately pushed** to all connected frontend clients:

```mermaid
sequenceDiagram
    participant CE as Crawler Engine
    participant WS as WebSocket Manager
    participant C1 as Dashboard Client 1
    participant C2 as Dashboard Client 2

    CE->>WS: broadcast_threat(threat_doc)
    WS->>C1: {"type": "NEW_THREAT", "data": {...}}
    WS->>C2: {"type": "NEW_THREAT", "data": {...}}
    Note over C1,C2: Dashboard updates in real-time<br/>without page refresh
```

- Clients connect to `ws://localhost:8000/ws`
- Keep-alive via ping/pong messages
- Disconnected clients are automatically cleaned up

---

## 11. Frontend Architecture

### 11.1 Service Layer

File: [threatService.ts](file:///d:/Projects/Trinetra/TRINETRA/trinetra-main-frontend/src/services/threatService.ts)

The frontend uses a **graceful fallback pattern**:
1. Try calling the real backend API
2. If it fails → use mock data so the UI still works

```typescript
async function withFallback<T>(apiFn: () => Promise<T>, fallback: T): Promise<T> {
    try {
        return await apiFn();
    } catch (error) {
        console.warn('API call failed, using mock data');
        return fallback;
    }
}
```

### 11.2 API Client

File: [api.ts](file:///d:/Projects/Trinetra/TRINETRA/trinetra-main-frontend/src/services/api.ts)

Centralized API client with:
- Automatic Firebase auth token injection via `localStorage`
- Error handling with friendly messages
- Endpoints for: threats, entities, sectors, sources, keywords, stats

### 11.3 Pages

| Page | Purpose |
|------|---------|
| **Dashboard** | Live threat feed, threat timeline chart, sector health, entity graph |
| **AlertDetail** | Full details of a single threat — raw evidence, matched keywords, escalation |
| **AdminConfig** | Configure sources, keywords, regex patterns — all persisted to Firestore |
| **Investigation** | Threat investigation workflow tools |
| **Login** | Firebase Authentication (email/password) |

---

## 12. Full Data Flow — End to End

```mermaid
flowchart TD
    subgraph "DATA SOURCES"
        R["Reddit<br/>(5 cybersec subreddits)"]
        P["Pastebin<br/>(recent public pastes)"]
        G["Custom Forum URLs<br/>(admin-configured)"]
    end

    subgraph "CRAWL (Every 5 min)"
        E["Crawler Engine<br/>asyncio.gather()"]
    end

    subgraph "ANALYSIS (per post)"
        CD["1️⃣ Credential Detector<br/>24+ regex patterns"]
        NLP["2️⃣ NLP Analyzer<br/>5-phase pipeline"]
        TS["3️⃣ Threat Scorer<br/>0-100 unified score"]
    end

    subgraph "STORAGE"
        FS["Firestore<br/>threats collection"]
    end

    subgraph "DELIVERY"
        WS["WebSocket<br/>Real-time push"]
        API["REST API<br/>CRUD + search"]
    end

    subgraph "FRONTEND"
        DASH["Dashboard<br/>Live threat feed"]
        DETAIL["Alert Detail<br/>Evidence viewer"]
        ADMIN["Admin Config<br/>Sources/Keywords"]
    end

    R --> E
    P --> E
    G --> E
    E --> CD
    E --> NLP
    CD --> TS
    NLP --> TS
    TS -->|score ≥ 20 & not duplicate| FS
    FS --> API
    TS --> WS
    WS --> DASH
    API --> DASH
    API --> DETAIL
    FS -.-> ADMIN
    ADMIN -.->|Config changes| FS
```

---

## 13. Security Features

| Feature | How It Works |
|---------|-------------|
| **Firebase Auth** | Users must login with email/password; backend verifies Firebase ID tokens |
| **Credential Redaction** | Matched secrets are partially hidden before storage |
| **CORS Restrictions** | Only `localhost:5173` and `localhost:3000` allowed |
| **Content Limiting** | Raw evidence capped at 2000 chars, paste content at 5000 chars |
| **India-Specific Detection** | Aadhaar, PAN, Indian phone/bank patterns for PII protection |

---

## 14. Key Design Decisions to Mention to Judge

1. **Why regex over ML for credential detection?** — Credential formats (API keys, private keys) have very **deterministic patterns**. Regex gives **100% precision** on known formats with zero false negatives. ML would be overkill and less reliable here.

2. **Why keyword-based NLP instead of transformer models?** — For a real-time monitoring system processing hundreds of posts every 5 minutes, **speed matters**. Keyword + confidence scoring is fast, interpretable, and easily customizable by admins. A transformer model (BERT, etc.) could be added later for deeper semantic analysis.

3. **Why WebSocket for real-time updates?** — HTTP polling would waste bandwidth and add latency. WebSocket gives **instant push notifications** when new threats are detected.

4. **Why Firestore?** — Serverless, real-time capable, excellent for document storage (threat records are naturally document-shaped), and integrates seamlessly with Firebase Auth.

5. **Why the 20-score threshold?** — Prevents flooding the dashboard with low-quality detections. A score below 20 likely means only one vague keyword matched with no supporting evidence.

6. **Why three separate scrapers?** — Each data source has a fundamentally different API/structure. Reddit uses JSON API, Pastebin has a scraping API, and generic forums need HTML parsing. The `BaseScraper` abstract class ensures they all produce the same `RawPost` output.

7. **Why India-specific sector targeting?** — Trinetra is specifically designed to protect **Indian critical infrastructure**. The sector detection adds severity boosts when Indian entities are mentioned, making it more relevant than generic threat intelligence platforms.
