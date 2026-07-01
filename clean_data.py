"""
Data cleaning script for the OBD-II vehicle telemetry dataset.

Source data: https://www.kaggle.com/datasets/pedro2025/obd2-panel-opel-2012
See docs/data_cleaning.md for a full explanation of each step.

Usage:
    python clean_data.py
"""

import pandas as pd
import os

INPUT_PATH = "data/dataset.csv"
OUTPUT_PATH = "data/dataset_clean.csv.xz"

# Only the columns needed for this project are loaded.
# The full file has 31 columns and is ~180MB; several columns
# (ENGINE_STATUS, OBD_STATUS, TORQUE, POWER, etc.) are empty or
# mostly missing and aren't used here.
COLUMNS_NEEDED = [
    "timestamp", "RPM", "SPEED", "THROTTLE_POS",
    "ACCELERATOR_POS_D", "COOLANT_TEMP", "GEAR",
    "FUEL_LEVEL", "FUEL_USAGE_ML_MIN", "segment_id", "segment_file",
]


def clean_data(input_path: str = INPUT_PATH, output_path: str = OUTPUT_PATH) -> pd.DataFrame:
    df = pd.read_csv(input_path, usecols=COLUMNS_NEEDED)

    # Convert timestamp from text to an actual datetime type,
    # required for chronological sorting and time-based analysis.
    df["timestamp"] = pd.to_datetime(df["timestamp"])

    # SPEED == 255 is the sensor's invalid-reading placeholder, not a
    # real speed value. Remove these rows.
    before = len(df)
    df = df[df["SPEED"] < 255]
    removed = before - len(df)

    # Sort by trip, then by time, so downstream analysis (e.g. harsh
    # braking detection) sees rows in correct chronological order.
    df = df.sort_values(["segment_id", "timestamp"]).reset_index(drop=True)

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    df.to_csv(output_path, index=False, compression="xz")

    print(f"Rows before cleaning: {before}")
    print(f"Invalid SPEED rows removed: {removed}")
    print(f"Rows after cleaning: {len(df)}")
    print(f"Saved cleaned dataset to: {output_path}")

    return df


if __name__ == "__main__":
    clean_data()
