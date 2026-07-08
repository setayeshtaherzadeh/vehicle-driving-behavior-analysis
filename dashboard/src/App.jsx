import driveSample from "./data/drive_sample.json";
import periodSummary from "./data/period_summary.json";
import MetricCards from "./components/MetricCards";
import DriveTimeline from "./components/DriveTimeline";
import PeriodComparison from "./components/PeriodComparison";
import FuelSpeedScatter from "./components/FuelSpeedScatter";
import ReplaySimulation from "./components/ReplaySimulation";
import { correlation } from "./utils/stats";

export default function App() {
  const harshTotal = periodSummary.reduce((sum, p) => sum + p.harsh_events, 0);
  const totalReadings = periodSummary.reduce((sum, p) => sum + p.total_readings, 0);
  const harshShare = (harshTotal / totalReadings) * 100;

  const rates = periodSummary.map((p) => p.harsh_event_rate_per_1000);
  const fuel = periodSummary.map((p) => p.avg_fuel_usage_ml_min);
  const speed = periodSummary.map((p) => p.avg_speed);

  const fuelCorr = correlation(rates, fuel);
  const speedFuelCorr = correlation(speed, fuel);

  return (
    <div className="page">
      <header className="page-header">
        <h1>Driving behavior dashboard</h1>
        <p>
          Harsh braking and acceleration events detected from real OBD-II telemetry
          (2012 Opel Corsa, ~100 hours of driving), compared across 22 driving
          periods and checked against fuel consumption.
        </p>
      </header>

      <MetricCards
        harshTotal={harshTotal}
        harshShare={harshShare}
        fuelCorr={fuelCorr}
        speedFuelCorr={speedFuelCorr}
      />

      <section className="section">
        <h2>One continuous drive, with harsh events marked</h2>
        <p className="section-sub">
          A single recorded trip, showing where sudden braking or acceleration
          was flagged along the speed trace.
        </p>
     <DriveTimeline data={driveSample} />
</section>

<section className="section">
  <h2>Replay: live warning simulation</h2>
  <p className="section-sub">
    Plays the same recorded drive back second by second and surfaces a
    warning the instant a harsh event is detected — a stand-in for how
    this detection logic could feed a real-time in-car alert.
  </p>
  <ReplaySimulation data={driveSample} />
</section>

<section className="section">
  <h2>Harsh event rate across driving periods</h2>
        <p className="section-sub">
          Each period spans multiple drives between refuels. Rate is normalized
          per 1,000 readings so periods of different lengths are comparable.
        </p>
        <PeriodComparison data={periodSummary} />
      </section>

      <section className="section">
        <h2>Average speed vs. average fuel use</h2>
        <p className="section-sub">
          Higher-speed periods use more fuel per minute but show fewer harsh
          events &mdash; the raw harsh-event/fuel correlation above is negative
          because driving context (city vs. highway) affects both in opposite
          directions.
        </p>
        <FuelSpeedScatter data={periodSummary} />
      </section>
    </div>
  );
}
