import { useState } from "react";
import { Shield, Database, Activity } from "lucide-react";
import QueryInput from "./components/QueryInput.jsx";
import SqlPanel from "./components/SqlPanel.jsx";
import ChartRenderer from "./components/ChartRenderer.jsx";
import InsightCard from "./components/InsightCard.jsx";

export default function App() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const runQuery = async (prompt) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error || "Request failed");
      }
      setResult(json);
    } catch (err) {
      setError(err?.message || "Something went wrong");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-slate-800/60 bg-slate-950/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
              <Database size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-tight">SafeQuery AI</h1>
              <p className="text-xs text-slate-400">Privacy-first text-to-SQL analytics</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Shield size={14} className="text-emerald-400" />
            <span>Nemotron · Nebius · Local SQLite</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <QueryInput onSubmit={runQuery} loading={loading} />

        {error && (
          <div className="glass p-4 border-rose-500/30 bg-rose-500/5">
            <p className="text-sm text-rose-300">⚠ {error}</p>
          </div>
        )}

        {result && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Activity size={16} className="text-cyan-400" />
                  <h3 className="text-sm font-semibold text-slate-200">Chart</h3>
                  <span className="ml-auto text-xs text-slate-500 uppercase tracking-wide">
                    {result.chartType}
                  </span>
                </div>
                <ChartRenderer
                  data={result.data}
                  chartType={result.chartType}
                  xAxisKey={result.xAxisKey}
                  yAxisKey={result.yAxisKey}
                />
              </div>
              <SqlPanel sql={result.sql} security={result.security} />
            </div>
            <InsightCard
              explanation={result.explanation}
              rowCount={result.rowCount}
              timings={result.timings}
            />
          </>
        )}

        {!result && !error && !loading && (
          <div className="glass p-10 text-center">
            <Database size={40} className="mx-auto text-slate-600 mb-3" />
            <p className="text-slate-400 text-sm">
              Ask a question above to generate a chart from your local database.
            </p>
          </div>
        )}
      </main>

      <footer className="max-w-7xl mx-auto px-6 py-6 text-center text-xs text-slate-600">
        SafeQuery AI · SQL validated &amp; executed locally · No data leaves your environment
      </footer>
    </div>
  );
}
