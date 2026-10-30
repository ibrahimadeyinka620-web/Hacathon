# SafeQuery AI

Privacy-first, text-to-SQL database analytics dashboard. Natural language → SQL → charts, powered by NVIDIA Nemotron on Nebius Token Factory. SQL is validated (read-only SELECT only) and executed locally against SQLite.

## Setup

```bash
cp .env.example .env
# edit .env and set NEBIUS_API_KEY
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

## Security

- LLM-generated SQL is validated to start with `SELECT` and to contain no destructive keywords.
- Only read-only queries execute; multiple statements and comments are rejected.
- Database runs locally (SQLite); no data is sent to the LLM beyond the schema.
- API key is read from `process.env.NEBIUS_API_KEY` and never exposed to the frontend.
