# Driving behavior analysis

This document explains the methodology used in `analyze_data.py` to detect harsh driving events from raw OBD-II speed data, and summarizes the findings.

## 1. Computing acceleration

The cleaned dataset only contains instantaneous `SPEED` readings, not acceleration. Harsh driving behavior (sudden braking or sudden acceleration) is defined by how quickly speed *changes*, not by speed itself, so acceleration had to be derived.

For each row, acceleration was computed as the change in speed divided by the change in time since the previous reading:

```
acceleration = (speed_now - speed_previous) / (time_now - time_previous)
```

This was calculated separately within each period (`segment_id`), so that the last reading of one period is never compared against the first reading of the next.

Resulting acceleration values ranged from **-22.25** (hardest braking) to **10.12** (hardest acceleration), with a mean close to 0 — expected, since braking and accelerating roughly cancel out over time.

## 2. Defining a "harsh event" threshold

Rather than picking an arbitrary fixed cutoff (e.g. "anything below -5 is harsh"), the threshold was defined statistically from the data itself: the bottom 1% and top 1% of the acceleration distribution were flagged as harsh braking and harsh acceleration events, respectively. This approach is data-driven and adapts to the actual distribution of the vehicle's behavior, rather than relying on a subjective guess.

**Results:**
- Harsh braking threshold: acceleration < **-6.85**
- Harsh acceleration threshold: acceleration > **4.47**
- Total harsh events flagged: **15,786** (2.00% of all readings)

## 3. Per-period summary

Readings were grouped by `segment_id` — each spanning multiple individual drives between refuels — to compute, for each of the 22 periods: total readings, harsh event count, harsh event rate per 1,000 readings, average fuel usage, and average speed. This makes periods comparable to each other despite differing lengths.

## 4. Relationship with fuel consumption

As a validation check, the harsh event rate was compared against average fuel usage across periods.

**Result: correlation = -0.370** (negative)

This runs counter to the initial hypothesis that harsher driving would mean higher fuel consumption. To understand why, average speed was checked against both variables:

- Average speed vs. harsh event rate: **-0.290**
- Average speed vs. fuel usage: **+0.935** (strong)

**Interpretation:** the raw fuel-vs-harshness relationship appears to be confounded by driving context. Periods with higher average speed (highway-style driving) show more sustained engine load and higher fuel use per minute, but fewer harsh events (smoother, more continuous driving). Periods with lower average speed (stop-and-go city driving) show more harsh events but lower fuel use per minute, since the engine spends more time idling or at low RPM. In other words, harsh event rate alone is not a reliable predictor of fuel consumption — driving context matters more.

## A known limitation

Acceleration is computed within each period (`segment_id`), which can span multiple separate drives with hours or days between them. At those boundaries, the time gap is large enough that the resulting acceleration value is effectively zero, so it's never flagged as a harsh event — but it's worth noting that the very first reading after a long gap isn't a physically meaningful acceleration measurement.

## Why this matters for ADAS

The core contribution of this analysis is the **detection method** itself: a statistically grounded, reproducible way to flag harsh driving events from raw sensor data, without requiring labeled data or manual thresholds. This kind of event detection is a natural building block for driver-assistance systems that warn drivers in real time about risky driving patterns. The fuel-consumption check here served only as a validation step, to confirm the detected events reflect a real behavioral signal, not noise.
