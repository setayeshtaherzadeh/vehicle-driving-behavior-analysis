# telemetry-dashboard
Developed a real-time vehicle telemetry monitoring dashboard using React and TypeScript. The platform simulates live vehicle data streams, visualizes telemetry metrics, and provides rule-based anomaly detection and


###اگر هدف تو فقط اپلای باشد

من پروژه را در سه فاز می‌ساختم:

فاز 1 (۲ هفته)
Dashboard
Charts
Fake Data
فاز 2 (۱ هفته)
Alerts
Vehicle Health
فاز 3 (۱ هفته)
Trip History
بهبود UI

و تمام.




##Design and Implementation of a Real-Time Vehicle Telemetry Monitoring Dashboard Using Simulated Data

Features
Real-time telemetry streaming
Interactive charts
Alert management system
Vehicle health monitoring
Responsive UI

Live Telemetry Stream
 Vehicle Health Score
 Historical Charts
 Responsive Dashboard
 Simulated Vehicle Data







Dataset
This project analyzes real-world OBD-II telemetry from a 2012 Opel Corsa 1.2 (A12XER, 84 hp), collected over ~100 hours of driving between April 2025 and June 2026. Data and methodology courtesy of OBD2_panel_opel_2012 on Kaggle (logger source code), licensed under CC BY 4.0.
The dataset contains ~789,000 timestamped readings across 22 driving segments (trips), with signals including RPM, speed, throttle position, coolant temperature, gear, and fuel usage.
Data quality notes:

A small number of SPEED readings hit the sensor's upper bound (255), consistent with an invalid-reading placeholder rather than real speed; these were filtered out.
GEAR is not reported directly by the ECU — it's estimated from the RPM-to-speed ratio using a documented heuristic, so it's treated as approximate.
Several derived columns (e.g. TORQUE, POWER) had large gaps due to ECU polling limitations and were excluded or used only where coverage was sufficient.
