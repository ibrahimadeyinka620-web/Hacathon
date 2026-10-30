import { useState } from "react";
import { Send, Sparkles } from "lucide-react";

const PRESETS = [
  "Top 5 products by revenue",
  "Monthly revenue trend",
  "Revenue by country",
  "Active subscriptions by plan",
  "Orders by status",
];

export default function QueryInput({ onSubmit, loading }) {
  const [prompt, setPrompt] = useState("");

  const submit = (e) => {
    e?.preventDefault();
    const p = prompt.trim();
    if (!p || loading) return;
    onSubmit(p);
  };

  const chip = (text) => {
    setPrompt(text);
    if (!loading) onSubmit(text);
  };

  return (
    <div className="glass p-5">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={16} className="text-indigo-400" />
        <h2 className="text-sm font-semibold text-slate-200">Ask your data anything</h2>
      </div>
      <form onSubmit={submit} className="flex gap-2">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. Show monthly revenue for the last 6 months"
          className="flex-1 bg-slate-950/70 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !prompt.trim()}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium text-white transition"
        >
          {loading ? (
            <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Send size={16} />
          )}
          {loading ? "Thinking…" : "Query"}
        </button>
      </form>
      <div className="mt-3 flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p}
            onClick={() => chip(p)}
            disabled={loading}
            className="text-xs px-3 py-1.5 rounded-full bg-slate-800/70 hover:bg-slate-700 border border-slate-700 text-slate-300 transition disabled:opacity-50"
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}
