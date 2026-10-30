import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.NEBIUS_API_KEY;
const baseURL = process.env.NEBIUS_BASE_URL || "https://api.studio.nebius.ai/v1/";
const model = process.env.NEBIUS_MODEL || "nvidia/Llama-3.1-Nemotron-70B-Instruct-HF";

if (!apiKey) {
  console.warn("[ai] NEBIUS_API_KEY is not set. /api/query will fail until configured.");
}

const client = new OpenAI({
  apiKey: apiKey || "missing",
  baseURL,
  timeout: 30000,
  maxRetries: 1,
});


const SYSTEM_PROMPT = `You are SafeQuery AI, an expert SQL analyst. Given a database schema and a user question, you produce a single read-only SQL query and a chart recommendation.

RULES:
- Output ONLY a valid JSON object. No markdown, no code fences, no commentary.
- The SQL MUST start with SELECT and be read-only. Never use DROP, DELETE, UPDATE, INSERT, ALTER, TRUNCATE, CREATE, or PRAGMA.
- Use only tables/columns from the provided schema. Use proper JOINs and aliases.
- Limit result rows to at most 50 unless aggregation makes it naturally smaller.
- Prefer aggregated results suitable for charting.
- chartType must be one of: "bar", "line", "pie", "table".
- xAxisKey and yAxisKey must be column names present in the SELECT result (aliases allowed).
- explanation must be a short (1-2 sentence) plain-English insight about what the query answers.

JSON shape (exact keys):
{
  "sql": "SELECT ...",
  "explanation": "...",
  "chartType": "bar|line|pie|table",
  "xAxisKey": "column_name",
  "yAxisKey": "column_name"
}`;

export async function generateQuery(userPrompt, schema) {
  if (!apiKey) {
    throw new Error("NEBIUS_API_KEY is not configured on the server.");
  }

  const userContent = `Database schema:\n${schema}\n\nUser question: ${userPrompt}\n\nReturn only the JSON object.`;

  const completion = await client.chat.completions.create({
    model,
    temperature: 0.1,
    max_tokens: 800,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userContent },
    ],
  });

  const raw = completion?.choices?.[0]?.message?.content?.trim() || "";
  return parseModelJson(raw);
}

function parseModelJson(raw) {
  // Strip markdown code fences if present
  let text = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();

  // Try direct parse
  try {
    const obj = JSON.parse(text);
    return normalize(obj);
  } catch {
    // Try to extract first JSON object
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        const obj = JSON.parse(match[0]);
        return normalize(obj);
      } catch {
        // fall through
      }
    }
    throw new Error("Model did not return valid JSON: " + text.slice(0, 300));
  }
}

function normalize(obj) {
  if (!obj || typeof obj !== "object") throw new Error("Invalid model response");
  const sql = String(obj.sql || "").trim();
  const explanation = String(obj.explanation || "").trim();
  const chartType = String(obj.chartType || "bar").toLowerCase();
  const xAxisKey = String(obj.xAxisKey || "").trim();
  const yAxisKey = String(obj.yAxisKey || "").trim();

  if (!sql) throw new Error("Model returned empty SQL");
  if (!["bar", "line", "pie", "table"].includes(chartType)) {
    throw new Error("Invalid chartType from model: " + chartType);
  }
  return { sql, explanation, chartType, xAxisKey, yAxisKey };
}

export { SYSTEM_PROMPT };
