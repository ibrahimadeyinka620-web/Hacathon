import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const nebiusKey = process.env.NEBIUS_API_KEY;
const geminiKey = process.env.GEMINI_API_KEY;
const nebiusBaseURL = process.env.NEBIUS_BASE_URL || "https://api.tokenfactory.nebius.com/v1/";
const nebiusModel = process.env.NEBIUS_MODEL || "nvidia/Llama-3.1-Nemotron-70B-Instruct-HF";
const geminiModel = process.env.GEMINI_MODEL || "gemini-3-flash-preview";

if (!nebiusKey && !geminiKey) {
  console.warn("[ai] No NEBIUS_API_KEY or GEMINI_API_KEY set. Running in DEMO mode with canned SQL.");
}

const nebiusClient = nebiusKey
  ? new OpenAI({ apiKey: nebiusKey, baseURL: nebiusBaseURL, timeout: 30000, maxRetries: 1 })
  : null;

const SYSTEM_PROMPT = "You are SafeQuery AI, an expert SQL analyst. Given a database schema and a user question, produce a single read-only SQL query and a chart recommendation. Output ONLY a valid JSON object. SQL MUST start with SELECT and be read-only. Use only schema tables/columns. Limit 50 rows. chartType in bar,line,pie,table. xAxisKey/yAxisKey are result columns. explanation short. JSON: {sql,explanation,chartType,xAxisKey,yAxisKey}";

export async function generateQuery(userPrompt, schema) {
  if (nebiusClient) return generateNebius(userPrompt, schema);
  if (geminiKey) return generateGemini(userPrompt, schema);
  return demoGenerate(userPrompt);
}

async function generateNebius(userPrompt, schema) {
  const completion = await nebiusClient.chat.completions.create({
    model: nebiusModel,
    temperature: 0.1,
    max_tokens: 800,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: "Database schema:\n" + schema + "\n\nUser question: " + userPrompt + "\n\nReturn only the JSON object." },
    ],
  });
  const raw = completion?.choices?.[0]?.message?.content?.trim() || "";
  return parseModelJson(raw);
}

async function generateGemini(userPrompt, schema) {
  const url = "https://generativelanguage.googleapis.com/v1beta/models/" + geminiModel + ":generateContent?key=" + geminiKey;
  const body = {
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [{ role: "user", parts: [{ text: "Database schema:\n" + schema + "\n\nUser question: " + userPrompt + "\n\nReturn only the JSON object." }] }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 800 },
  };
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) {
    const t = await res.text();
    throw new Error("Gemini request failed (" + res.status + "): " + t.slice(0, 300));
  }
  const json = await res.json();
  const raw = json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
  return parseModelJson(raw);
}

function parseModelJson(raw) {
  let text = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  try { return normalize(JSON.parse(text)); } catch {}
  const match = text.match(/\{[\s\S]*\}/);
  if (match) { try { return normalize(JSON.parse(match[0])); } catch {} }
  throw new Error("Model did not return valid JSON: " + text.slice(0, 300));
}

function normalize(obj) {
  if (!obj || typeof obj !== "object") throw new Error("Invalid model response");
  const sql = String(obj.sql || "").trim();
  const explanation = String(obj.explanation || "").trim();
  const chartType = String(obj.chartType || "bar").toLowerCase();
  const xAxisKey = String(obj.xAxisKey || "").trim();
  const yAxisKey = String(obj.yAxisKey || "").trim();
  if (!sql) throw new Error("Model returned empty SQL");
  if (!["bar", "line", "pie", "table"].includes(chartType)) throw new Error("Invalid chartType: " + chartType);
  return { sql, explanation, chartType, xAxisKey, yAxisKey };
}
function demoGenerate(prompt) {
  const p = (prompt || "").toLowerCase();
  if (p.includes("country")) {
    return { sql: "SELECT u.country AS country, ROUND(SUM(o.total),2) AS revenue FROM orders o JOIN users u ON u.id=o.user_id WHERE o.status='completed' GROUP BY u.country ORDER BY revenue DESC", explanation: "Total completed-order revenue grouped by customer country.", chartType: "bar", xAxisKey: "country", yAxisKey: "revenue" };
  }
  if (p.includes("subscription") || p.includes("plan") || p.includes("mrr")) {
    return { sql: "SELECT plan, COUNT(*) AS subscribers, ROUND(SUM(mrr),2) AS total_mrr FROM subscriptions WHERE status='active' GROUP BY plan ORDER BY total_mrr DESC", explanation: "Active subscriptions and monthly recurring revenue by plan.", chartType: "bar", xAxisKey: "plan", yAxisKey: "total_mrr" };
  }
  if (p.includes("status")) {
    return { sql: "SELECT status, COUNT(*) AS orders FROM orders GROUP BY status ORDER BY orders DESC", explanation: "Order counts grouped by status.", chartType: "pie", xAxisKey: "status", yAxisKey: "orders" };
  }
  if (p.includes("monthly") || p.includes("trend") || p.includes("over time")) {
    return { sql: "SELECT substr(created_at,1,7) AS month, ROUND(SUM(total),2) AS revenue FROM orders WHERE status='completed' GROUP BY month ORDER BY month", explanation: "Completed-order revenue per month over time.", chartType: "line", xAxisKey: "month", yAxisKey: "revenue" };
  }
  if (p.includes("top") && p.includes("product")) {
    return { sql: "SELECT p.name AS product, ROUND(SUM(oi.quantity*oi.price),2) AS revenue FROM order_items oi JOIN products p ON p.id=oi.product_id JOIN orders o ON o.id=oi.order_id WHERE o.status='completed' GROUP BY p.name ORDER BY revenue DESC LIMIT 5", explanation: "Top 5 products by completed-order revenue.", chartType: "bar", xAxisKey: "product", yAxisKey: "revenue" };
  }
  return { sql: "SELECT p.category AS category, ROUND(SUM(oi.quantity*oi.price),2) AS revenue FROM order_items oi JOIN products p ON p.id=oi.product_id JOIN orders o ON o.id=oi.order_id WHERE o.status='completed' GROUP BY p.category ORDER BY revenue DESC", explanation: "Completed-order revenue by product category.", chartType: "bar", xAxisKey: "category", yAxisKey: "revenue" };
}

