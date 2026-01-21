export const scanWifi = async () => {
  console.log('Scanning Wi-Fi...');
  return { bssid: 'mock-bssid', rssi: -50 };
};
