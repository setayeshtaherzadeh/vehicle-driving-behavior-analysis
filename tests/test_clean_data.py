"""
Tests for clean_data.py.

Uses a small, hand-built CSV instead of the real ~9MB dataset, so these
run in a fraction of a second and don't depend on the data file existing.
"""

import pandas as pd
import pytest

from clean_data import clean_data, COLUMNS_NEEDED


@pytest.fixture
def raw_csv(tmp_path):
    """A tiny raw dataset with the same shape as the real one, including
    one invalid SPEED=255 reading and rows that are intentionally out of
    chronological order."""
    raw = pd.DataFrame({
        "timestamp": [
            "2025-04-01 10:00:02", "2025-04-01 10:00:00", "2025-04-01 10:00:01",
            "2025-04-01 11:00:00",
        ],
        "RPM": [1500, 1400, 1450, 1600],
        "SPEED": [30.0, 0.0, 255.0, 40.0],  # row index 2 is the invalid placeholder
        "THROTTLE_POS": [20.0, 10.0, 15.0, 25.0],
        "ACCELERATOR_POS_D": [20.0, 10.0, 15.0, 25.0],
        "COOLANT_TEMP": [80, 79, 79, 85],
        "GEAR": [2, 1, 1, 3],
        "FUEL_LEVEL": [50.0, 50.1, 50.05, 49.0],
        "FUEL_USAGE_ML_MIN": [40.0, 35.0, 37.0, 45.0],
        "segment_id": [1, 1, 1, 2],
        "segment_file": ["a.csv", "a.csv", "a.csv", "b.csv"],
    })
    input_path = tmp_path / "raw.csv"
    raw.to_csv(input_path, index=False)
    return input_path


def test_drops_invalid_speed_255(raw_csv, tmp_path):
    output_path = tmp_path / "clean.csv.xz"
    result = clean_data(input_path=str(raw_csv), output_path=str(output_path))
    assert (result["SPEED"] == 255).sum() == 0


def test_sorts_chronologically_within_segment(raw_csv, tmp_path):
    output_path = tmp_path / "clean.csv.xz"
    result = clean_data(input_path=str(raw_csv), output_path=str(output_path))
    segment_1 = result[result["segment_id"] == 1].reset_index(drop=True)
    assert list(segment_1["timestamp"]) == sorted(segment_1["timestamp"])


def test_output_has_expected_columns(raw_csv, tmp_path):
    output_path = tmp_path / "clean.csv.xz"
    result = clean_data(input_path=str(raw_csv), output_path=str(output_path))
    assert set(result.columns) == set(COLUMNS_NEEDED)


def test_writes_output_file(raw_csv, tmp_path):
    output_path = tmp_path / "clean.csv.xz"
    clean_data(input_path=str(raw_csv), output_path=str(output_path))
    assert output_path.exists()
    reloaded = pd.read_csv(output_path, compression="xz")
    assert len(reloaded) == 3  # 4 raw rows minus 1 invalid SPEED=255 row
