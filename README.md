# SafeQuery AI

Privacy-first, text-to-SQL database analytics dashboard. Natural language → SQL → charts, powered by NVIDIA Nemotron on Nebius Token Factory (with optional Google Gemini fallback and an offline DEMO mode). SQL is validated (read-only SELECT only) and executed locally against SQLite.

## Setup

```bash
cp .env.example .env
# (optional) add NEBIUS_API_KEY and/or GEMINI_API_KEY
npm install
```

## Run (dev)

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend:  http://localhost:3001

## Run (prod)

```bash
npm run build
npm start
```

## AI providers

The backend picks a provider automatically:
1. **Nebius** (preferred for the hackathon) — set `NEBIUS_API_KEY`.
2. **Google Gemini** (free key at https://aistudio.google.com/apikey) — set `GEMINI_API_KEY`.
3. **DEMO mode** — if no key is set, canned SQL is returned so the app still works offline.

## Security

- LLM-generated SQL is validated to start with `SELECT` and to contain no destructive keywords.
- Only read-only queries execute; multiple statements and comments are rejected.
- Database runs locally (SQLite); no data is sent to the LLM beyond the schema.
- API key is read from environment and never exposed to the frontend.
- Node >= 22 required (uses built-in node:sqlite).
