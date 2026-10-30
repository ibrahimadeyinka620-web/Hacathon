import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
const COLORS = ["#6366f1", "#22d3ee", "#f59e0b", "#10b981", "#f43f5e", "#a78bfa", "#fb923c", "#34d399"];

export default function ChartRenderer({ data, chartType, xAxisKey, yAxisKey }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
        No data to display.
      </div>
    );
  }

  if (chartType === "table") {
    const keys = Object.keys(data[0]);
    return (
      <div className="overflow-auto max-h-80 scrollbar-thin">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 bg-slate-800">
            <tr>
              {keys.map((k) => (
                <th key={k} className="text-left px-3 py-2 font-medium text-slate-300 border-b border-slate-700">
                  {k}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} className="border-b border-slate-800/60 hover:bg-slate-800/40">
                {keys.map((k) => (
                  <td key={k} className="px-3 py-2 text-slate-200">{String(row[k] ?? "")}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  const xKey = xAxisKey && data[0][xAxisKey] !== undefined ? xAxisKey : Object.keys(data[0])[0];
  const yKey = yAxisKey && data[0][yAxisKey] !== undefined ? yAxisKey : Object.keys(data[0])[1] || Object.keys(data[0])[0];

  if (chartType === "pie") {
    return (
      <ResponsiveContainer width="100%" height={320}>
        <PieChart>
          <Pie data={data} dataKey={yKey} nameKey={xKey} cx="50%" cy="50%" outerRadius={110} label>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8 }} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (chartType === "line") {
    return (
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey={xKey} stroke="#94a3b8" tick={{ fontSize: 12 }} />
          <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
          <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8 }} />
          <Legend />
          <Line type="monotone" dataKey={yKey} stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey={xKey} stroke="#94a3b8" tick={{ fontSize: 12 }} />
        <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
        <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8 }} />
        <Legend />
        <Bar dataKey={yKey} fill="#6366f1" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
