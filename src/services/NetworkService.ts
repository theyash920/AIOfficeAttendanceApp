import { Platform } from 'react-native';

// Check if we're running in Expo Go (native modules won't be available)
let WifiManager: any = null;
let isNativeModuleAvailable = false;

try {
  WifiManager = require('react-native-wifi-reborn').default;
  isNativeModuleAvailable = WifiManager !== null;
} catch (e) {
  console.log('WiFi native module not available, using mock data');
}

export const NetworkService = {
  async requestPermission(): Promise<boolean> {
    if (!isNativeModuleAvailable) {
      // Mock: Always return true in Expo Go
      return true;
    }
    
    if (Platform.OS === 'android') {
      const { PermissionsAndroid } = require('react-native');
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
    },

  async getWifiStrength(): Promise<number> {
    if (!isNativeModuleAvailable) {
      // Mock: Return a simulated strong signal for testing in Expo Go
      return -45; // Strong signal in dBm
    }
    
    try {
      const rssi = await WifiManager.getCurrentSignalStrength();
      return rssi;
    } catch (error) {
      console.error("WiFi Strength Error:", error);
      return -100;
    }
  },

  async getCurrentSSID(): Promise<string> {
    if (!isNativeModuleAvailable) {
      // Mock: Return a fake SSID for testing
      return 'Office_WiFi_Mock';
    }
    
    try {
      return await WifiManager.getCurrentWifiSSID();
    } catch (error) {
      console.error("WiFi SSID Error:", error);
      return 'Unknown';
    }
  },

  /**
   * Observes WiFi signal strength changes by polling every 2 seconds.
   * Returns a subscription object with a remove() method to stop observing.
   */
  observeWifi(callback: (strength: number) => void): { remove: () => void } {
    // Convert RSSI (dBm) to percentage (0-100)
    const rssiToPercentage = (rssi: number): number => {
      const minRssi = -100;
      const maxRssi = -30;
      const percentage = ((rssi - minRssi) / (maxRssi - minRssi)) * 100;
      return Math.max(0, Math.min(100, Math.round(percentage)));
    };

    if (!isNativeModuleAvailable) {
      // Mock: Simulate varying signal strength for demo purposes
      let mockStrength = 85;
      const pollInterval = setInterval(() => {
        // Simulate slight fluctuations in signal
        mockStrength = 80 + Math.floor(Math.random() * 15);
        callback(mockStrength);
      }, 2000);

      // Initial callback
      callback(mockStrength);

      return {
        remove: () => {
          clearInterval(pollInterval);
        }
      };
    }

    const pollInterval = setInterval(async () => {
      try {
        const rssi = await this.getWifiStrength();
        const percentage = rssiToPercentage(rssi);
        callback(percentage);
      } catch (error) {
        console.error("WiFi observation error:", error);
        callback(0);
      }
    }, 2000);

    // Initial call
    this.getWifiStrength().then(rssi => {
      callback(rssiToPercentage(rssi));
    }).catch(() => callback(0));

    return {
      remove: () => {
        clearInterval(pollInterval);
      }
    };
  }
};
