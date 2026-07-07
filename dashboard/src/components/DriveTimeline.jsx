import {
  LineChart,
  Line,
  Scatter,
  ComposedChart,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

export default function DriveTimeline({ data }) {
  const harshPoints = data.filter((d) => d.harsh_event);

  return (
    <div className="chart-card">
      <div className="legend-row">
        <span>
          <span className="swatch" style={{ background: "#1d5c9e" }} />
          Speed (km/h)
        </span>
        <span>
          <span className="swatch" style={{ background: "#c9532b" }} />
          Harsh braking / acceleration
        </span>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2ded3" vertical={false} />
          <XAxis
            dataKey="seconds"
            type="number"
            tick={{ fontSize: 11, fill: "#6b665a" }}
            label={{ value: "seconds into drive", position: "insideBottom", offset: -4, fontSize: 11, fill: "#6b665a" }}
          />
          <YAxis tick={{ fontSize: 11, fill: "#6b665a" }} label={{ value: "km/h", angle: -90, position: "insideLeft", fontSize: 11, fill: "#6b665a" }} />
          <Tooltip
            formatter={(value, name) => [value, name === "SPEED" ? "speed" : name]}
            labelFormatter={(v) => `${v}s`}
          />
          <Line type="monotone" dataKey="SPEED" stroke="#1d5c9e" strokeWidth={2} dot={false} isAnimationActive={false} />
          <Scatter data={harshPoints} dataKey="SPEED" fill="#c9532b" isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
