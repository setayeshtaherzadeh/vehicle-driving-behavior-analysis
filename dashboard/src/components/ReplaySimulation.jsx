import { useEffect, useRef, useState, useMemo } from "react";
import {
  ComposedChart,
  Line,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

const SPEED_OPTIONS = [10, 30, 60];
const WINDOW_SECONDS = 120; // trailing window shown in the chart

function formatClock(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function ReplaySimulation({ data = [] }) {
  if (!data.length) {
    return <div className="chart-card replay-card">No drive data available.</div>;
  }
  const [playing, setPlaying] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(30);
  const [simSeconds, setSimSeconds] = useState(0);
  const [warning, setWarning] = useState(null); // { type: 'brake' | 'accel', key }
  const [eventsSoFar, setEventsSoFar] = useState(0);

  const rafRef = useRef(null);
  const lastFrameRef = useRef(null);
  const lastFiredIndexRef = useRef(-1);
  const warningTimeoutRef = useRef(null);

  const startSeconds = data[0]?.seconds ?? 0;
  const endSeconds = data[data.length - 1]?.seconds ?? 0;
  const totalDuration = endSeconds - startSeconds;

  // Precompute event indices once
  const harshIndices = useMemo(
    () => data.reduce((acc, d, i) => (d.harsh_event ? [...acc, i] : acc), []),
    [data]
  );

  const currentAbsolute = startSeconds + simSeconds;

  // Find current index via the nearest reading at or before currentAbsolute
  const currentIndex = useMemo(() => {
    let lo = 0;
    let hi = data.length - 1;
    if (currentAbsolute <= data[0].seconds) return 0;
    if (currentAbsolute >= data[data.length - 1].seconds) return data.length - 1;
    while (lo < hi) {
      const mid = Math.ceil((lo + hi) / 2);
      if (data[mid].seconds <= currentAbsolute) lo = mid;
      else hi = mid - 1;
    }
    return lo;
  }, [currentAbsolute, data]);

  const currentPoint = data[currentIndex];

  const windowData = useMemo(() => {
    const from = currentAbsolute - WINDOW_SECONDS;
    return data.filter((d) => d.seconds <= currentAbsolute && d.seconds >= from);
  }, [currentAbsolute, data]);

  const windowHarshPoints = windowData.filter((d) => d.harsh_event);

  useEffect(() => {
    if (!playing) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastFrameRef.current = null;
      return;
    }

    const tick = (now) => {
      if (lastFrameRef.current == null) lastFrameRef.current = now;
      const deltaRealSeconds = (now - lastFrameRef.current) / 1000;
      lastFrameRef.current = now;

      setSimSeconds((prev) => {
        const next = prev + deltaRealSeconds * speedMultiplier;
        if (next >= totalDuration) {
          setPlaying(false);
          return totalDuration;
        }
        return next;
      });

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [playing, speedMultiplier, totalDuration]);

  // Fire a warning the moment playback crosses into a new harsh event
  useEffect(() => {
    if (!playing) return;
    if (currentIndex === lastFiredIndexRef.current) return;
    if (currentPoint?.harsh_event) {
      lastFiredIndexRef.current = currentIndex;
      const type = currentPoint.acceleration < 0 ? "brake" : "accel";
      setWarning({ type, key: currentIndex });
      setEventsSoFar((n) => n + 1);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = setTimeout(() => setWarning(null), 1600);
    }
  }, [currentIndex, playing, currentPoint]);

  useEffect(() => () => clearTimeout(warningTimeoutRef.current), []);

  function handlePlayPause() {
    if (simSeconds >= totalDuration) {
      handleReset();
      setPlaying(true);
      return;
    }
    setPlaying((p) => !p);
  }

  function handleReset() {
    setPlaying(false);
    setSimSeconds(0);
    setEventsSoFar(0);
    lastFiredIndexRef.current = -1;
    setWarning(null);
  }

  const progressPct = totalDuration ? (simSeconds / totalDuration) * 100 : 0;

  return (
    <div className="chart-card replay-card">
      <div className="replay-disclaimer">
        This replays recorded trip data at accelerated speed to demonstrate how a
        warning would surface in the UI — it is not a live sensor feed.
      </div>

      <div className="replay-controls">
        <button className="replay-btn primary" onClick={handlePlayPause}>
          {playing ? "Pause" : simSeconds >= totalDuration ? "Replay" : "Play"}
        </button>
        <button className="replay-btn" onClick={handleReset}>
          Reset
        </button>
        <div className="replay-speed-group">
          {SPEED_OPTIONS.map((s) => (
            <button
              key={s}
              className={`replay-btn speed ${speedMultiplier === s ? "active" : ""}`}
              onClick={() => setSpeedMultiplier(s)}
            >
              {s}&times;
            </button>
          ))}
        </div>
        <div className="replay-clock mono">
          {formatClock(simSeconds)} / {formatClock(totalDuration)}
        </div>
      </div>

      <div className="replay-progress-track">
        <div className="replay-progress-fill" style={{ width: `${progressPct}%` }} />
      </div>

      <div className="replay-live-row">
        <div className="replay-speed-readout">
          <div className="metric-label">current speed</div>
          <div className="metric-value mono">
            {currentPoint ? Math.round(currentPoint.SPEED) : 0}
            <span className="unit"> km/h</span>
          </div>
        </div>
        <div className="replay-speed-readout">
          <div className="metric-label">events detected</div>
          <div className="metric-value mono">{eventsSoFar}</div>
        </div>

        {warning && (
          <div className={`replay-warning ${warning.type}`} key={warning.key}>
            {warning.type === "brake" ? "⚠ Harsh braking detected" : "⚠ Harsh acceleration detected"}
          </div>
        )}
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={windowData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2ded3" vertical={false} />
          <XAxis
            dataKey="seconds"
            type="number"
            domain={[currentAbsolute - WINDOW_SECONDS, currentAbsolute]}
            tick={{ fontSize: 11, fill: "#6b665a" }}
            label={{ value: "seconds into drive", position: "insideBottom", offset: -4, fontSize: 11, fill: "#6b665a" }}
          />
          <YAxis
            domain={[0, "dataMax + 10"]}
            tick={{ fontSize: 11, fill: "#6b665a" }}
            label={{ value: "km/h", angle: -90, position: "insideLeft", fontSize: 11, fill: "#6b665a" }}
          />
          <Tooltip labelFormatter={(v) => `${v}s`} formatter={(value) => [Math.round(value), "speed"]} />
          <Line type="monotone" dataKey="SPEED" stroke="#1d5c9e" strokeWidth={2} dot={false} isAnimationActive={false} />
          <Scatter data={windowHarshPoints} dataKey="SPEED" fill="#c9532b" isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
