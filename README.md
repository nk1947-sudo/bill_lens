# MedBill Advocate Pro

> AI-powered medical bill analysis platform. Helps patients identify billing errors, upcoding, duplicate charges, and unbundling — then generates a plain-English action plan and phone script to dispute them.

---

## Architecture

```
bill_lense/
├── backend/              # FastAPI — REST API + LLM chain
├── frontend/             # React (Vite) — SPA with auth & dashboard
├── medbill_advocate/     # Core Python OCR + deterministic rules engine
└── docker-compose.yml    # Production orchestration
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, TanStack Query, React Router v6 |
| Backend | FastAPI, Uvicorn, Pydantic v2 |
| Database | MongoDB Atlas (Motor async driver) |
| Auth | JWT (python-jose) + bcrypt |
| LLM | Together AI (OpenAI-compatible) — Llama 3.3 70B + Llama Vision |
| OCR | pdfplumber (PDF) + Vision LLM (images) |
| DevOps | Docker, Docker Compose, Nginx |

---

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 20+
- MongoDB Atlas connection string (provided in `backend/.env`)

### 1. Backend

```bash
cd backend
pip install -r requirements.txt
# Set TOGETHER_API_KEY in backend/.env
uvicorn app.main:app --reload --port 8000
```

API docs available at: `http://localhost:8000/docs`

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
# Vite proxies /api → localhost:8000
```

App available at: `http://localhost:5173`

### 3. Docker (Production)

```bash
docker-compose up --build
# Frontend served at :80, backend at :8000
```

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | — | Create account (bcrypt hashed) |
| POST | `/api/auth/login` | — | Login, returns JWT |
| GET | `/api/auth/me` | JWT | Current user profile |
| POST | `/api/auth/disclaimer` | JWT | Accept legal disclaimer |
| POST | `/api/analyze` | JWT | Upload bill → OCR → LLM audit |
| GET | `/api/history` | JWT | List past analyses |
| GET | `/api/history/:id` | JWT | Get single analysis |
| DELETE | `/api/history/:id` | JWT | Delete analysis |
| GET | `/health` | — | Health check |

---

## LLM Pipeline

```
Uploaded File (PDF/Image)
        │
        ▼
  [OCR Extraction]
  pdfplumber (PDF) or Vision LLM (image)
        │
        ▼
  [Billing Analyst Agent]
  Llama 3.3 70B — flags suspicious charges,
  calculates risk score (0–100)
        │
        ▼
  [Patient Advocate Agent]
  Llama 3.3 70B — generates plain-English
  summary, 5-step action plan, phone script
        │
        ▼
  Saved to MongoDB → returned to frontend
```

---

## Database Schema (MongoDB)

**`users` collection**
```json
{
  "_id": "ObjectId",
  "email": "string",
  "full_name": "string",
  "hashed_password": "bcrypt hash",
  "disclaimer_accepted": "boolean",
  "created_at": "datetime"
}
```

**`medical_bills` collection**
```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId",
  "facility_name": "string",
  "total_amount": "float",
  "risk_score": "0–100",
  "original_text": "string",
  "file_metadata": { "filename", "file_type", "file_size" },
  "analysis": {
    "flagged_charges": [...],
    "summary": "string",
    "action_plan": [...],
    "phone_script": "string"
  },
  "status": "completed",
  "created_at": "datetime"
}
```

---

## Frontend Pages

| Route | Description |
|-------|-------------|
| `/login` | JWT login with Zod validation |
| `/signup` | Registration with confirm-password check |
| `/dashboard` | History table + stats (TanStack Query) |
| `/analyze` | Drag-and-drop upload + 3-step progress |
| `/results/:id` | Full audit/strategy view + PDF download |

**Security features:** DisclaimerModal blocks access until accepted on first login. JWT stored in localStorage with automatic 401 redirect.

---

## Environment Variables

Create `backend/.env`:

```env
MONGODB_URL=mongodb+srv://<user>:<pass>@cluster.mongodb.net/medbill_pro
MONGODB_DB_NAME=medbill_pro
SECRET_KEY=<min-32-char-random-string>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
TOGETHER_API_KEY=<your-together-ai-key>
TOGETHER_BASE_URL=https://api.together.xyz/v1
EXTRACTION_MODEL=meta-llama/Llama-Vision-Free
ANALYSIS_MODEL=meta-llama/Llama-3.3-70B-Instruct-Turbo-Free
ADVOCACY_MODEL=meta-llama/Llama-3.3-70B-Instruct-Turbo-Free
```

---

## Branches

| Branch | Purpose |
|--------|---------|
| `main` | Production-ready code |
| `dev` | Active development |
| `stash` | Teammate's OCR + rules engine contributions |

---

> **Disclaimer:** Not medical or legal advice. MedBill Advocate Pro helps patients ask the right questions. Always verify findings with qualified professionals.
