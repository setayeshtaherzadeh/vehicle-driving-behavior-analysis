"""
Tests for analyze_data.py.

Each test builds a small synthetic DataFrame with known, hand-calculated
values instead of relying on the real dataset, so the expected result
can be verified exactly.
"""

import pandas as pd

from analyze_data import (
    compute_acceleration,
    flag_harsh_events,
    summarize_by_segment,
    correlate_with_fuel,
)


def test_acceleration_matches_manual_calculation():
    # Speed goes 0 -> 10 -> 8 over 3 seconds, one reading per second.
    df = pd.DataFrame({
        "timestamp": ["2025-01-01 00:00:00", "2025-01-01 00:00:01", "2025-01-01 00:00:02"],
        "SPEED": [0.0, 10.0, 8.0],
        "segment_id": [1, 1, 1],
    })
    result = compute_acceleration(df)
    # First row of a segment has no prior reading to diff against.
    assert pd.isna(result["acceleration"].iloc[0])
    assert result["acceleration"].iloc[1] == 10.0  # (10 - 0) / 1s
    assert result["acceleration"].iloc[2] == -2.0  # (8 - 10) / 1s


def test_acceleration_never_crosses_trip_boundary():
    # Segment 1 ends at speed 60, segment 2 starts at speed 0 one second later.
    # If trips were compared, this would look like a huge harsh brake.
    df = pd.DataFrame({
        "timestamp": ["2025-01-01 00:00:00", "2025-01-01 00:00:01", "2025-01-01 00:00:02"],
        "SPEED": [60.0, 60.0, 0.0],
        "segment_id": [1, 1, 2],
    })
    result = compute_acceleration(df)
    # The first reading of segment 2 must be NaN, not a huge negative number.
    assert pd.isna(result["acceleration"].iloc[2])


def test_flag_harsh_events_uses_1st_and_99th_percentile():
    # 100 evenly spaced values from -50 to 49: the 1st percentile is near
    # the bottom, the 99th near the top, by construction.
    accelerations = list(range(-50, 50))
    df = pd.DataFrame({"acceleration": accelerations})
    result, brake_thr, accel_thr = flag_harsh_events(df, lower_q=0.01, upper_q=0.99)

    assert brake_thr == df["acceleration"].quantile(0.01)
    assert accel_thr == df["acceleration"].quantile(0.99)
    # The single lowest value must always be flagged as harsh braking.
    assert result.loc[result["acceleration"].idxmin(), "harsh_braking"]
    # The single highest value must always be flagged as harsh acceleration.
    assert result.loc[result["acceleration"].idxmax(), "harsh_acceleration"]
    # harsh_event is just the OR of the two.
    assert (result["harsh_event"] == (result["harsh_braking"] | result["harsh_acceleration"])).all()


def test_summarize_by_segment_aggregates_correctly():
    df = pd.DataFrame({
        "segment_id": [1, 1, 2, 2],
        "SPEED": [10.0, 20.0, 30.0, 50.0],
        "harsh_event": [True, False, False, False],
        "FUEL_USAGE_ML_MIN": [40.0, 60.0, 10.0, 20.0],
    })
    summary = summarize_by_segment(df)

    seg1 = summary.loc[1]
    assert seg1["total_readings"] == 2
    assert seg1["harsh_events"] == 1
    assert seg1["avg_speed"] == 15.0
    assert seg1["avg_fuel_usage_ml_min"] == 50.0
    assert seg1["harsh_event_rate_per_1000"] == 500.0  # 1 out of 2 readings, per 1000

    seg2 = summary.loc[2]
    assert seg2["harsh_events"] == 0
    assert seg2["harsh_event_rate_per_1000"] == 0.0


def test_correlate_with_fuel_detects_negative_correlation():
    # harsh_event_rate goes up while fuel usage goes down: a perfect
    # negative correlation, matching the real finding in this project.
    summary = pd.DataFrame({
        "harsh_event_rate_per_1000": [10, 20, 30, 40],
        "avg_fuel_usage_ml_min": [40, 30, 20, 10],
        "avg_speed": [60, 45, 30, 15],
    })
    result = correlate_with_fuel(summary)
    assert result["harsh_events_vs_fuel"] == -1.0
