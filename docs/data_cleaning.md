# Data cleaning process

The raw dataset (dataset.csv) contains 789,373 rows across 31 columns, but many of them aren't usable as-is — some are entirely empty, some have invalid sensor readings, and the timestamp is stored as plain text. Before any analysis, I ran the raw data through the following cleaning steps:

## 1. Column selection

Out of 31 columns, I kept only the 11 relevant to this analysis (timestamp, RPM, speed, throttle, accelerator position, coolant temperature, gear, fuel level, fuel usage, and trip/segment identifiers). Columns like ENGINE_STATUS and OBD_STATUS were entirely empty and dropped; others like TORQUE and POWER had 78%+ missing values due to ECU polling gaps and weren't reliable enough to include here.

## 2. Timestamp conversion

The timestamp column was stored as plain text, so I converted it to a proper datetime type. This is required for any time-based operation (sorting chronologically, calculating time gaps, detecting sudden changes over time).

## 3. Filtering invalid sensor readings

A small number of SPEED values were exactly 255 — the sensor's upper bound, and a known placeholder for an invalid reading rather than an actual speed. These 107 rows (0.01% of the data) were removed.

## 4. Sorting

Data was sorted by trip (segment_id) and then by timestamp, since later analysis (e.g. detecting harsh braking) depends on rows being in correct chronological order within each trip.

## 5. Export

The cleaned dataset was saved as an xz-compressed CSV (dataset_clean.csv.xz), reducing file size from 179MB to about 9MB while keeping 789,266 rows (99.99% of the original data retained).
