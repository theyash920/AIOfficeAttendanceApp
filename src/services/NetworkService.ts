import { Platform, Alert, Linking } from 'react-native';
import * as Location from 'expo-location';

// Check if we're running in Expo Go (native modules won't be available)
let WifiManager: any = null;
let isNativeModuleAvailable = false;

try {
  WifiManager = require('react-native-wifi-reborn').default;
  isNativeModuleAvailable = WifiManager !== null && WifiManager !== undefined;
  console.log('[NetworkService] WiFi module loaded:', isNativeModuleAvailable);
  console.log('[NetworkService] WifiManager type:', typeof WifiManager);
} catch (e: any) {
  console.log('[NetworkService] WiFi native module not available:', e?.message || e);
}

export const NetworkService = {
  /**
   * Returns true if using mock WiFi data (Expo Go), false if using real native module
   */
  isUsingMockData(): boolean {
    console.log('[NetworkService] isUsingMockData:', !isNativeModuleAvailable);
    return !isNativeModuleAvailable;
  },

  async requestPermission(): Promise<boolean> {
    console.log('[NetworkService] Requesting permission...');
    console.log('[NetworkService] Native module available:', isNativeModuleAvailable);

    if (!isNativeModuleAvailable) {
      // Mock: Always return true in Expo Go
      console.log('[NetworkService] Mock mode - returning true for permission');
      return true;
    }

    if (Platform.OS === 'android') {
      try {
        // Use expo-location for permissions since it's properly configured as an Expo plugin
        const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
        console.log('[NetworkService] Existing location permission status:', existingStatus);

        if (existingStatus === 'granted') {
          console.log('[NetworkService] Location permission already granted');
          return true;
        }

        // Request permission using expo-location
        const { status } = await Location.requestForegroundPermissionsAsync();
        console.log('[NetworkService] Location permission request result:', status);

        if (status !== 'granted') {
          // Show alert to guide user to settings
          Alert.alert(
            'Location Permission Required',
            'WiFi detection requires location permission on Android. This is used to verify you are connected to the office network. Please enable it in Settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() }
            ]
          );
          return false;
        }

        // Check if location services are enabled
        const isLocationEnabled = await Location.hasServicesEnabledAsync();
        console.log('[NetworkService] Location services enabled:', isLocationEnabled);

        if (!isLocationEnabled) {
          Alert.alert(
            'Location Services Required',
            'Please turn on Location Services to detect WiFi network.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() }
            ]
          );
          return false;
        }

        return true;
      } catch (error: any) {
        console.error('[NetworkService] Permission request error:', error?.message || error);
        return false;
      }
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
      console.log('[NetworkService] WiFi strength (RSSI):', rssi);
      return rssi;
    } catch (error: any) {
      console.error('[NetworkService] WiFi Strength Error:', error?.message || error);
      return -100;
    }
  },

  async getCurrentSSID(): Promise<string> {
    if (!isNativeModuleAvailable) {
      // Mock: Return a fake SSID for testing
      console.log('[NetworkService] Mock mode - returning mock SSID');
      return 'Office_WiFi_Mock';
    }

    try {
      const ssid = await WifiManager.getCurrentWifiSSID();
      console.log('[NetworkService] Current SSID:', ssid);
      return ssid || 'Unknown';
    } catch (error: any) {
      console.error('[NetworkService] WiFi SSID Error:', error?.message || error);
      // Return more specific error info
      return 'SSID_Error';
    }
  },

  async getCurrentBSSID(): Promise<string> {
    console.log('[NetworkService] getCurrentBSSID called, native available:', isNativeModuleAvailable);

    if (!isNativeModuleAvailable) {
      // Mock: Return the office BSSID for testing in Expo Go
      return 'A0:91:CA:9B:76:AA';
    }

    try {
      console.log('[NetworkService] Calling WifiManager.getBSSID()...');
      const bssid = await WifiManager.getBSSID();
      console.log('[NetworkService] Current BSSID result:', bssid);
      return bssid || 'Unknown';
    } catch (error: any) {
      console.error('[NetworkService] WiFi BSSID Error:', error?.message || error);
      // Return error indicator instead of Unknown
      return 'BSSID_Error';
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

    console.log('[NetworkService] Starting WiFi observation with native module');

    const pollInterval = setInterval(async () => {
      try {
        const rssi = await this.getWifiStrength();
        const percentage = rssiToPercentage(rssi);
        callback(percentage);
      } catch (error) {
        console.error('[NetworkService] WiFi observation error:', error);
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

