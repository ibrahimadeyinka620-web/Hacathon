import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

import { getDatabaseSchema, getDb } from "./db.js";
import { generateQuery } from "./ai.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT || 3001);

const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
// Always allow the local dev frontend and the server's own origin (production build)
for (const o of ["http://localhost:5173", "http://localhost:" + PORT, "http://127.0.0.1:" + PORT]) {
  if (!allowedOrigins.includes(o)) allowedOrigins.push(o);
}

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS"));
    },
  })
);
app.use(express.json({ limit: "1mb" }));

const DESTRUCTIVE = /\b(DROP|DELETE|UPDATE|INSERT|ALTER|TRUNCATE|CREATE|PRAGMA|ATTACH|DETACH|REPLACE|GRANT|REVOKE)\b/i;
const COMMENT = /(--|\/\*|\*\/)/;

function validateSql(sql) {
  const trimmed = (sql || "").trim();
  if (!trimmed) throw new Error("Empty SQL");
  if (!/^SELECT\b/i.test(trimmed)) throw new Error("SQL must start with SELECT");
  if (COMMENT.test(trimmed)) throw new Error("SQL comments are not allowed");
  const withoutTrailing = trimmed.replace(/;+\s*$/, "");
  if (withoutTrailing.includes(";")) throw new Error("Multiple statements are not allowed");
  if (DESTRUCTIVE.test(withoutTrailing)) throw new Error("Destructive SQL keyword detected");
  return withoutTrailing;
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "safequery-ai" });
});

app.get("/api/schema", (_req, res) => {
  try {
    res.json({ schema: getDatabaseSchema() });
  } catch (err) {
    res.status(500).json({ error: "Failed to read schema" });
  }
});

app.post("/api/query", async (req, res) => {
  const started = Date.now();
  const prompt = (req.body?.prompt || "").toString().trim();
  if (!prompt) {
    return res.status(400).json({ error: "prompt is required" });
  }
  if (prompt.length > 2000) {
    return res.status(400).json({ error: "prompt too long" });
  }

  let aiMs = 0;
  let dbMs = 0;
  try {
    const schema = getDatabaseSchema();
    const aiStart = Date.now();
    const aiResult = await generateQuery(prompt, schema);
    aiMs = Date.now() - aiStart;

    const sql = validateSql(aiResult.sql);

    const dbStart = Date.now();
    const db = getDb();
    const stmt = db.prepare(sql);
    const rows = stmt.all();
    dbMs = Date.now() - dbStart;

    const totalMs = Date.now() - started;
    return res.json({
      prompt,
      sql,
      explanation: aiResult.explanation,
      chartType: aiResult.chartType,
      xAxisKey: aiResult.xAxisKey,
      yAxisKey: aiResult.yAxisKey,
      data: rows,
      rowCount: rows.length,
      timings: { aiMs, dbMs, totalMs },
      security: { localExecution: true, validated: true },
    });
  } catch (err) {
    const totalMs = Date.now() - started;
    const message = err?.message || "Unknown error";
    // Never leak stack traces
    const status = /api key|not configured/i.test(message) ? 503 : 400;
    return res.status(status).json({ error: message, timings: { totalMs } });
  }
});

// Serve frontend build if present (production)
const distDir = path.join(__dirname, "..", "dist");
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get("*", (_req, res) => res.sendFile(path.join(distDir, "index.html")));
}

app.listen(PORT, () => {
  console.log(`SafeQuery AI server listening on http://localhost:${PORT}`);
});
