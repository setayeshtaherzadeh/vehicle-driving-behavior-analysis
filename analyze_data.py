"""
Driving behavior analysis for the OBD-II vehicle telemetry dataset.

This script builds on the cleaned dataset (see clean_data.py / docs/data_cleaning.md)
and identifies harsh driving events (sudden braking / acceleration) from raw
speed data. See docs/analysis.md for a full explanation of each step.

Usage:
    python analyze_data.py
"""

import pandas as pd

INPUT_PATH = "data/dataset_clean.csv.xz"
OUTPUT_PATH = "data/analysis_summary.csv"


def compute_acceleration(df):
    """
    Compute instantaneous acceleration (change in speed per second)
    for every row, calculated separately within each trip (segment_id)
    so that readings from different trips are never compared to each other.
    """
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    df["time_diff"] = df.groupby("segment_id")["timestamp"].diff().dt.total_seconds()
    df["speed_diff"] = df.groupby("segment_id")["SPEED"].diff()
    df["acceleration"] = df["speed_diff"] / df["time_diff"]
    return df


def flag_harsh_events(df, lower_q=0.01, upper_q=0.99):
    """
    Flag harsh braking / harsh acceleration events using a data-driven
    threshold: the bottom and top percentile of the acceleration
    distribution, rather than an arbitrary fixed number.
    """
    brake_threshold = df["acceleration"].quantile(lower_q)
    accel_threshold = df["acceleration"].quantile(upper_q)

    df["harsh_braking"] = df["acceleration"] < brake_threshold
    df["harsh_acceleration"] = df["acceleration"] > accel_threshold
    df["harsh_event"] = df["harsh_braking"] | df["harsh_acceleration"]

    return df, brake_threshold, accel_threshold


def summarize_by_segment(df):
    """
    Build a per-trip (segment) summary: harsh event rate, average fuel
    usage, and average speed — used to compare trips against each other
    and to check the relationship with fuel consumption.
    """
    summary = df.groupby("segment_id").agg(
        total_readings=("SPEED", "count"),
        harsh_events=("harsh_event", "sum"),
        avg_fuel_usage_ml_min=("FUEL_USAGE_ML_MIN", "mean"),
        avg_speed=("SPEED", "mean"),
    )
    summary["harsh_event_rate_per_1000"] = (
        summary["harsh_events"] / summary["total_readings"] * 1000
    )
    return summary.sort_values("harsh_event_rate_per_1000", ascending=False)


def main():
    df = pd.read_csv(INPUT_PATH, compression="xz")
    df = compute_acceleration(df)
    df, brake_thr, accel_thr = flag_harsh_events(df)

    print(f"Harsh braking threshold: acceleration < {brake_thr:.2f}")
    print(f"Harsh acceleration threshold: acceleration > {accel_thr:.2f}")
    print(f"Total harsh events flagged: {df['harsh_event'].sum():,} "
          f"({df['harsh_event'].mean()*100:.2f}% of readings)")

    summary = summarize_by_segment(df)
    summary.to_csv(OUTPUT_PATH)
    print(f"\nPer-trip summary saved to {OUTPUT_PATH}")
    print(summary.head())


if __name__ == "__main__":
    main()
