import { Sparkles } from "lucide-react";

export default function InsightCard({ explanation, rowCount, timings }) {
  return (
    <div className="glass p-5">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles size={16} className="text-amber-400" />
        <h3 className="text-sm font-semibold text-slate-200">Natural Language Insight</h3>
      </div>
      <p className="text-slate-300 text-sm leading-relaxed">
        {explanation || "No insight available."}
      </p>
      <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
        {typeof rowCount === "number" && (
          <span className="px-2 py-1 rounded-md bg-slate-800/60">Rows: {rowCount}</span>
        )}
        {timings?.aiMs != null && (
          <span className="px-2 py-1 rounded-md bg-slate-800/60">AI: {timings.aiMs}ms</span>
        )}
        {timings?.dbMs != null && (
          <span className="px-2 py-1 rounded-md bg-slate-800/60">DB: {timings.dbMs}ms</span>
        )}
        {timings?.totalMs != null && (
          <span className="px-2 py-1 rounded-md bg-slate-800/60">Total: {timings.totalMs}ms</span>
        )}
      </div>
    </div>
  );
}
