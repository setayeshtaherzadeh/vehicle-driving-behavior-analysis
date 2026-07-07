export default function MetricCards({ harshTotal, harshShare, fuelCorr, speedFuelCorr }) {
  const cards = [
    { label: "Harsh events flagged", value: harshTotal.toLocaleString() },
    { label: "Share of all readings", value: `${harshShare.toFixed(1)}%` },
    { label: "Harsh events vs fuel use", value: fuelCorr.toFixed(2), warn: fuelCorr < 0 },
    { label: "Speed vs fuel use", value: speedFuelCorr.toFixed(2) },
  ];

  return (
    <div className="metric-grid">
      {cards.map((c) => (
        <div className="metric-card" key={c.label}>
          <p className="metric-label">{c.label}</p>
          <p className={`metric-value${c.warn ? " warn" : ""}`}>{c.value}</p>
        </div>
      ))}
    </div>
  );
}
