export const SignalMath = {
  // Convert dBm RSSI to a 0-100 percentage score
  calculateConfidence(rssi: number, targetRssi: number = -50): number {
    if (rssi >= targetRssi) return 100;
    if (rssi <= -100) return 0;
    
    // Simple linear interpolation
    const score = 100 - (Math.abs(targetRssi - rssi) * 2);
    return Math.max(0, Math.min(100, score));
  }
};
