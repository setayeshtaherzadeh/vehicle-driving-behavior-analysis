"""
Generates dashboard/src/data/drive_sample.json — the single continuous drive
used by the "One continuous drive" chart and the replay simulation.

This exists because the dashboard needs ONE representative trip to visualize
in detail, but the cleaned dataset (data/dataset_clean.csv.xz) only has
`segment_id`, which groups multiple individual drives between refuels
(see docs/analysis.md), not individual trips. This script splits each
segment into individual continuous drives and picks one using an explicit,
reproducible rule instead of a manual/arbitrary choice.

Selection rule:
1. Split each segment_id into individual trips wherever the time gap between
   consecutive readings exceeds TRIP_GAP_SECONDS (the car was off/parked).
2. Keep only trips between MIN_TRIP_SECONDS and MAX_TRIP_SECONDS long, so the
   sample is long enough to be meaningful but short enough to watch in a demo.
3. Among those, pick the trip with the most harsh events (braking/acceleration
   flagged using the same global 1%/99% thresholds as analyze_data.py) —
   the trip that best demonstrates the detection system, not a quiet drive.

Usage:
    python generate_drive_sample.py
"""

import json
import pandas as pd

INPUT_PATH = "data/dataset_clean.csv.xz"
OUTPUT_PATH = "dashboard/src/data/drive_sample.json"

TRIP_GAP_SECONDS = 60      # gap larger than this = car was off, new trip
MIN_TRIP_SECONDS = 20 * 60  # 20 minutes
MAX_TRIP_SECONDS = 40 * 60  # 40 minutes


def split_into_trips(df):
    """Assign a trip_id, splitting on time gaps > TRIP_GAP_SECONDS within each segment_id."""
    df = df.sort_values(["segment_id", "timestamp"]).reset_index(drop=True)
    time_gap = df.groupby("segment_id")["timestamp"].diff().dt.total_seconds()
    new_trip = (time_gap.isna()) | (time_gap > TRIP_GAP_SECONDS)
    df["trip_id"] = new_trip.cumsum()
    return df


def compute_acceleration(df):
    df["time_diff"] = df.groupby("segment_id")["timestamp"].diff().dt.total_seconds()
    df["speed_diff"] = df.groupby("segment_id")["SPEED"].diff()
    df["acceleration"] = df["speed_diff"] / df["time_diff"]
    return df


def flag_harsh_events(df, lower_q=0.01, upper_q=0.99):
    """Same global, data-driven thresholds used in analyze_data.py."""
    brake_threshold = df["acceleration"].quantile(lower_q)
    accel_threshold = df["acceleration"].quantile(upper_q)
    df["harsh_event"] = (df["acceleration"] < brake_threshold) | (df["acceleration"] > accel_threshold)
    return df


def select_trip(df):
    trip_stats = df.groupby("trip_id").agg(
        duration_seconds=("timestamp", lambda s: (s.max() - s.min()).total_seconds()),
        harsh_events=("harsh_event", "sum"),
    )
    candidates = trip_stats[
        (trip_stats["duration_seconds"] >= MIN_TRIP_SECONDS)
        & (trip_stats["duration_seconds"] <= MAX_TRIP_SECONDS)
    ]
    if candidates.empty:
        raise ValueError(
            f"No trip between {MIN_TRIP_SECONDS}s and {MAX_TRIP_SECONDS}s found; "
            "widen MIN_TRIP_SECONDS/MAX_TRIP_SECONDS."
        )
    chosen_trip_id = candidates["harsh_events"].idxmax()
    return chosen_trip_id, trip_stats.loc[chosen_trip_id]


def main():
    df = pd.read_csv(INPUT_PATH, compression="xz")
    df["timestamp"] = pd.to_datetime(df["timestamp"])

    df = split_into_trips(df)
    df = compute_acceleration(df)
    df = flag_harsh_events(df)

    chosen_trip_id, stats = select_trip(df)
    print(f"Selected trip_id={chosen_trip_id}: "
          f"{stats['duration_seconds']:.0f}s, {int(stats['harsh_events'])} harsh events")

    trip = df[df["trip_id"] == chosen_trip_id].sort_values("timestamp").reset_index(drop=True)
    start = trip["timestamp"].iloc[0]
    trip["seconds"] = (trip["timestamp"] - start).dt.total_seconds().astype(int)

    sample = trip[["seconds", "SPEED", "acceleration", "harsh_event"]].to_dict(orient="records")

    with open(OUTPUT_PATH, "w") as f:
        json.dump(sample, f)

    print(f"Saved {len(sample)} readings to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
