import { useState } from "react";
import { Copy, Check, ShieldCheck, Database } from "lucide-react";

export default function SqlPanel({ sql, security }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(sql || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <div className="glass p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Database size={16} className="text-indigo-400" />
          <h3 className="text-sm font-semibold text-slate-200">SQL Code &amp; Security</h3>
        </div>
        {security?.localExecution && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
            <ShieldCheck size={13} /> 🔒 Local Execution
          </span>
        )}
      </div>
      <div className="relative">
        <pre className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 text-xs text-emerald-300 overflow-auto max-h-60 scrollbar-thin font-mono">
          <code>{sql || "-- no SQL generated --"}</code>
        </pre>
        <button
          onClick={copy}
          className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300"
          title="Copy SQL"
        >
          {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
        </button>
      </div>
      <p className="mt-3 text-xs text-slate-500">
        Validated: read-only SELECT only. Executed locally against your SQLite instance. No data leaves your environment.
      </p>
    </div>
  );
}
