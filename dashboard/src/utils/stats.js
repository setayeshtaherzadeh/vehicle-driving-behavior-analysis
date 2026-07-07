// Mirrors the thresholding logic in analyze_data.py: harsh events are the
// bottom/top 1% of the acceleration distribution, not an arbitrary cutoff.
export function summarizeDrive(drivePoints) {
  const total = drivePoints.length;
  const harshCount = drivePoints.filter((p) => p.harsh_event).length;
  return {
    total,
    harshCount,
    harshShare: total ? (harshCount / total) * 100 : 0,
  };
}

export function correlation(xs, ys) {
  const n = xs.length;
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0,
    denX = 0,
    denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  return num / Math.sqrt(denX * denY);
}
