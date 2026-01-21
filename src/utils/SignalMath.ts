export const isSignalStrongEnough = (rssi: number, threshold: number) => {
  return rssi >= threshold;
};
