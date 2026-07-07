import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

export default function FuelSpeedScatter({ data }) {
  return (
    <div className="chart-card">
      <ResponsiveContainer width="100%" height={260}>
        <ScatterChart margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2ded3" />
          <XAxis
            dataKey="avg_speed"
            type="number"
            name="avg speed"
            unit=" km/h"
            tick={{ fontSize: 11, fill: "#6b665a" }}
            label={{ value: "avg speed (km/h)", position: "insideBottom", offset: -4, fontSize: 11, fill: "#6b665a" }}
          />
          <YAxis
            dataKey="avg_fuel_usage_ml_min"
            type="number"
            name="avg fuel use"
            unit=" ml/min"
            tick={{ fontSize: 11, fill: "#6b665a" }}
            label={{ value: "avg fuel use (ml/min)", angle: -90, position: "insideLeft", fontSize: 11, fill: "#6b665a" }}
          />
          <Tooltip cursor={{ strokeDasharray: "3 3" }} labelFormatter={() => ""} />
          <Scatter data={data} fill="#2f7d5a" isAnimationActive={false} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
