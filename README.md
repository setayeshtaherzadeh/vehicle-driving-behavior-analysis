# Dataset
This project analyzes real-world OBD-II telemetry from a 2012 Opel Corsa 1.2 (A12XER, 84 hp), collected over ~100 hours of driving between April 2025 and June 2026. Data and methodology courtesy of Data and methodology courtesy of [OBD2_panel_opel_2012 on Kaggle](https://www.kaggle.com/datasets/pedro2025/obd2-panel-opel-2012)<br/>

The dataset contains ~789,000 timestamped readings across 22 driving segments (trips), with signals including RPM, speed, throttle position, coolant temperature, gear, and fuel usage.<br/>

## Data quality notes:

- A small number of SPEED readings hit the sensor's upper bound (255), consistent with an invalid-reading placeholder rather than real speed; these were filtered out.
- GEAR is not reported directly by the ECU — it's estimated from the RPM-to-speed ratio using a documented heuristic, so it's treated as approximate.
- Several derived columns (e.g. TORQUE, POWER) had large gaps due to ECU polling limitations and were excluded or used only where coverage was sufficient.
