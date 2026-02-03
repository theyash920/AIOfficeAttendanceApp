import { supabase } from '../api/SupabaseClient';
import { Platform } from 'react-native';
import * as Location from 'expo-location';

// Use your computer's local IP address for physical device testing
// Both phone and computer must be on the same WiFi network
const BACKEND_URL = 'http://192.168.1.41:8000';  

export const FaceService = {
  /**
   * Smart Attendance - Unified endpoint that handles both registration and verification:
   * - If face is new: registers the face and creates employee ID
   * - If face exists: verifies and marks attendance
   * - Validates WiFi signal strength (must be >= 80%)
   */
  async smartAttendance(imageUri: string, officeId: string, wifiStrength: number): Promise<any> {
    try {
      console.log('[FaceService] Smart attendance with WiFi strength:', wifiStrength);

      // 1. Get current location 
      let latitude = 0.0;
      let longitude = 0.0;

      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          latitude = location.coords.latitude;
          longitude = location.coords.longitude;
        } else {
          console.warn('[FaceService] Location permission denied. Sending 0,0.');
        }
      } catch (locErr) {
        console.warn('[FaceService] Failed to get location:', locErr);
      }

      const formData = new FormData();
      formData.append('office_id', officeId);
      formData.append('wifi_confidence', wifiStrength.toString());
      formData.append('latitude', latitude.toString());
      formData.append('longitude', longitude.toString());

      const filename = imageUri.split('/').pop() || 'face.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('image', { uri: imageUri, name: filename, type } as any);

      const response = await fetch(`${BACKEND_URL}/smart-attendance`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Backend error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('[FaceService] Smart attendance result:', result);

      return result;

    } catch (err: any) {
      console.log('[FaceService] Smart attendance exception:', err?.message || err);
      throw err;
    }
  },

  /**
   * Smart Checkout - Endpoint for face-based checkout:
   * - Verifies face against stored embeddings
   * - Logs checkout with location and timestamp
   */
  async smartCheckout(imageUri: string, officeId: string, wifiStrength: number): Promise<any> {
    try {
      console.log('[FaceService] Smart checkout with WiFi strength:', wifiStrength);

      // 1. Get current location
      let latitude = 0.0;
      let longitude = 0.0;

      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          latitude = location.coords.latitude;
          longitude = location.coords.longitude;
        } else {
          console.warn('[FaceService] Location permission denied. Sending 0,0.');
        }
      } catch (locErr) {
        console.warn('[FaceService] Failed to get location:', locErr);
      }

      const formData = new FormData();
      formData.append('office_id', officeId);
      formData.append('wifi_confidence', wifiStrength.toString());
      formData.append('latitude', latitude.toString());
      formData.append('longitude', longitude.toString());

      const filename = imageUri.split('/').pop() || 'face.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('image', { uri: imageUri, name: filename, type } as any);

      const response = await fetch(`${BACKEND_URL}/smart-checkout`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Backend error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('[FaceService] Smart checkout result:', result);

      return result;

    } catch (err: any) {
      console.log('[FaceService] Smart checkout exception:', err?.message || err);
      throw err;
    }
  },

  /**
   * Uploads the Initial Face Image to the backend for registration.
   * @param userId The user's ID.
   * @param imageUri The local URI of the captured image.
   * @param officeId The office ID.
   */
  async uploadInitialFace(userId: string, imageUri: string, officeId: string): Promise<boolean> {
    try {
      console.log('[FaceService] Uploading face for userId:', userId);

      const formData = new FormData();
      formData.append('user_id', userId);

      // Append image file
      const filename = imageUri.split('/').pop() || 'face.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('image', { uri: imageUri, name: filename, type } as any);

      const response = await fetch(`${BACKEND_URL}/register-face`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Backend error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('[FaceService] Registration success:', result);
      return true;

    } catch (err: any) {
      console.log('[FaceService] Upload exception:', err?.message || err);
      throw err;
    }
  },

  /**
   * Verifies the face image against the stored embedding.
   * Also sends current location and office details.
   */
  async verifyFace(userId: string, imageUri: string, officeId: string, wifiStrength: number): Promise<any> {
    try {
      console.log('[FaceService] Verifying face for userId:', userId);

      // 1. Get current location
      let latitude = 0.0;
      let longitude = 0.0;

      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          latitude = location.coords.latitude;
          longitude = location.coords.longitude;
        } else {
          console.warn('[FaceService] Location permission denied. Sending 0,0.');
        }
      } catch (locErr) {
        console.warn('[FaceService] Failed to get location:', locErr);
      }

      const formData = new FormData();
      formData.append('user_id', userId);
      formData.append('office_id', officeId);
      formData.append('wifi_confidence', wifiStrength.toString());
      formData.append('latitude', latitude.toString());
      formData.append('longitude', longitude.toString());

      const filename = imageUri.split('/').pop() || 'face.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('image', { uri: imageUri, name: filename, type } as any);

      const response = await fetch(`${BACKEND_URL}/verify-face`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Backend error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('[FaceService] Verification result:', result);

      // Return the full result object { verified, message, location, timestamp }
      return result;

    } catch (err: any) {
      console.log('[FaceService] Verification exception:', err?.message || err);
      throw err;
    }
  },

  async getEmployee(userId: string) {
    const { data, error } = await supabase
      .from('employees')
      .select('id, full_name, face_embedding, office_id')
      .eq('id', userId)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Employee not found');
    return data;
  }
};
