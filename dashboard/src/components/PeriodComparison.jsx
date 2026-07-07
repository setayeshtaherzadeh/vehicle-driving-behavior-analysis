import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";

export default function PeriodComparison({ data }) {
  const sorted = [...data].sort(
    (a, b) => b.harsh_event_rate_per_1000 - a.harsh_event_rate_per_1000
  );

  return (
    <div className="chart-card">
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={sorted} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2ded3" vertical={false} />
          <XAxis
            dataKey="segment_id"
            tickFormatter={(id) => `P${id}`}
            tick={{ fontSize: 11, fill: "#6b665a" }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#6b665a" }}
            label={{ value: "events per 1000 readings", angle: -90, position: "insideLeft", fontSize: 11, fill: "#6b665a" }}
          />
          <Tooltip
            formatter={(value) => [value.toFixed(1), "harsh events / 1000"]}
            labelFormatter={(id) => `Period ${id}`}
          />
          <Bar dataKey="harsh_event_rate_per_1000" fill="#1d5c9e" radius={[4, 4, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
