import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, Alert, TouchableOpacity } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import FaceScanOverlay from '../components/FaceScanOverlay';
import SignalMeter from '../components/SignalMeter';
import SuccessAnimation from '../components/SuccessAnimation';
import { NetworkService } from '../services/NetworkService';
import { FaceService } from '../services/FaceService';
import { OfficeSignatures } from '../constants/OfficeSignatures';

// WiFi threshold must match backend (80% - room strength)
const WIFI_THRESHOLD = 80;

export default function VerificationPage({ navigation, route }: any) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [wifiStrength, setWifiStrength] = useState(0);
  const [currentBSSID, setCurrentBSSID] = useState<string>('');
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const officeId = (route?.params?.officeId as string | undefined) ?? 'OFFICE_MOCK_01';
  const userName = route?.params?.userName as string | undefined;
  const isCheckout = route?.params?.isCheckout as boolean | undefined;

  const [isPermissionReady, setPermissionReady] = useState(false);

  useEffect(() => {
    let wifiSub: { remove: () => void } | null = null;
    let bssidInterval: ReturnType<typeof setInterval> | null = null;

    const initWifi = async () => {
      // Request location permission first (required for WiFi access on Android)
      const granted = await NetworkService.requestPermission();
      console.log('[VerificationPage] Permission granted:', granted);

      if (!granted) {
        Alert.alert(
          'Permission Required',
          'Location permission is needed to detect WiFi. Please grant permission in Settings.',
          [{ text: 'OK' }]
        );
        setPermissionReady(true);
        return;
      }

      // Start WiFi observation only after permission is granted
      wifiSub = NetworkService.observeWifi((strength: number) => setWifiStrength(strength));

      // Check BSSID periodically
      const checkBSSID = async () => {
        const bssid = await NetworkService.getCurrentBSSID();
        console.log('[VerificationPage] BSSID check result:', bssid);
        setCurrentBSSID(bssid.toUpperCase());
      };

      await checkBSSID();
      bssidInterval = setInterval(checkBSSID, 3000);
      setPermissionReady(true);
    };

    initWifi();

    return () => {
      if (wifiSub) wifiSub.remove();
      if (bssidInterval) clearInterval(bssidInterval);
    };
  }, []);

  const [attendanceDetails, setAttendanceDetails] = useState<{
    userId?: string;
    userName?: string;
    isNewUser?: boolean;
    timestamp: string;
    message: string;
    location?: {
      latitude: number;
      longitude: number;
    };
    placeName?: string;
    isCheckout?: boolean;
  } | null>(null);

  // Check if connected to office WiFi
  const isOfficeWifi = currentBSSID === OfficeSignatures.BSSID.toUpperCase();

  const triggerVerification = async () => {
    // STRICT BSSID CHECK - Must be on office WiFi to verify
    if (!isOfficeWifi) {
      Alert.alert(
        '📶 Connect to Office WiFi',
        'You must be connected to the office WiFi network to mark attendance.\n\nPlease connect to the office WiFi and try again.',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    if (wifiStrength < WIFI_THRESHOLD) {
      Alert.alert(
        'Weak Signal',
        `WiFi signal too weak (${wifiStrength}%). Please move closer to the office router. Required: ${WIFI_THRESHOLD}%`
      );
      return;
    }

    if (!cameraRef.current) return;

    setIsVerifying(true);
    try {
      // 1. Capture Photo
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7, base64: false });
      if (!photo?.uri) throw new Error('Failed to capture photo');

      // 2. Use Smart Attendance or Checkout based on mode
      const result = isCheckout
        ? await FaceService.smartCheckout(photo.uri, officeId, wifiStrength)
        : await FaceService.smartAttendance(photo.uri, officeId, wifiStrength);

      if (!result.success) {
        // Handle different failure cases
        if (result.action === 'wifi_weak') {
          Alert.alert('Weak Signal', result.message);
        } else if (result.action === 'face_error') {
          Alert.alert('Face Detection Failed', result.message);
        } else if (result.action === 'face_not_found') {
          // Show friendly "Not in Office" popup for face not recognized
          Alert.alert(
            '📍 Not in Office',
            'Verification failed. Please make sure you are in the office and connected to the office WiFi.\n\nIf you are a new employee, please register first.',
            [{ text: 'OK', style: 'default' }]
          );
        } else {
          Alert.alert(
            '📍 Not in Office',
            'Verification failed. Please make sure you are in the office and connected to the office WiFi.',
            [{ text: 'OK', style: 'default' }]
          );
        }
        return;
      }

      // Success! (Either registered new user, marked attendance, or checkout)
      setIsSuccess(true);

      // Reverse geocode to get precise place name
      let placeName = '';
      if (result.location) {
        try {
          const [address] = await Location.reverseGeocodeAsync({
            latitude: result.location.latitude,
            longitude: result.location.longitude
          });
          console.log('[VerificationPage] Reverse geocode result:', JSON.stringify(address, null, 2));

          if (address) {
            // Build a precise address from available fields
            const addressParts: string[] = [];

            // Add building/POI name if available
            if (address.name && address.name !== address.street) {
              addressParts.push(address.name);
            }

            // Add street with number if available
            if (address.streetNumber && address.street) {
              addressParts.push(`${address.streetNumber} ${address.street}`);
            } else if (address.street) {
              addressParts.push(address.street);
            }

            // Add subregion/district/neighborhood
            if (address.subregion) {
              addressParts.push(address.subregion);
            } else if (address.district) {
              addressParts.push(address.district);
            }

            // Add city
            if (address.city) {
              addressParts.push(address.city);
            }

            // Create the display string - show up to 3 components for readability
            placeName = addressParts.slice(0, 3).join(', ') ||
              `${result.location.latitude.toFixed(6)}, ${result.location.longitude.toFixed(6)}`;
          }
        } catch (geoError) {
          console.log('[VerificationPage] Reverse geocoding failed:', geoError);
          placeName = `${result.location.latitude.toFixed(6)}, ${result.location.longitude.toFixed(6)}`;
        }
      }

      setAttendanceDetails({
        userId: result.user_id,
        userName: result.user_name,
        isNewUser: result.is_new_user,
        timestamp: result.timestamp,
        message: result.message,
        location: result.location,
        placeName,
        isCheckout: isCheckout
      });

      // Navigate back to Home with updated state
      setTimeout(() => navigation.navigate('Home', {
        userId: result.user_id,
        officeId,
        userName: result.user_name,
        isCheckedIn: !isCheckout // false after checkout, true after check-in
      }), 4000);
    } catch (e: any) {
      console.log('[VerificationPage] Error:', e?.message || e);

      // All errors (network, backend, etc.) show the same friendly popup
      Alert.alert(
        '📍 Not in Office',
        'You are not connected to the office network.\n\nPlease go to the office, connect to the office WiFi, and try again.',
        [{ text: 'OK', style: 'default' }]
      );
    } finally {
      setIsVerifying(false);
    }
  };

  if (!permission) {
    return <View style={styles.loader}><Text>Loading Camera...</Text></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.loader}>
        <Text style={styles.permissionText}>We need your permission to show the camera</Text>
        <TouchableOpacity style={styles.actionBtn} onPress={requestPermission}>
          <Text style={styles.btnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!isSuccess ? (
        <>
          <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="front" />
          <FaceScanOverlay />
          <View style={styles.uiLayer}>
            <SignalMeter strength={wifiStrength} />
            <Text style={styles.instruction}>
              {!isOfficeWifi
                ? '❌ Not connected to office WiFi'
                : wifiStrength < WIFI_THRESHOLD
                  ? `WiFi: ${wifiStrength}% (Need ${WIFI_THRESHOLD}%)`
                  : isCheckout ? '✅ Ready to scan face for checkout' : '✅ Ready to scan face'}
            </Text>
            {!isOfficeWifi && (
              <Text style={styles.wifiHint}>
                Connect to the office network to continue
              </Text>
            )}
            {/* Debug info - remove after testing */}
            <Text style={styles.debugText}>
              BSSID: {currentBSSID || 'None'} | Expected: {OfficeSignatures.BSSID}
            </Text>
            <TouchableOpacity
              style={[
                styles.actionBtn,
                (!isOfficeWifi || wifiStrength < WIFI_THRESHOLD) && styles.actionBtnDisabled,
                isCheckout && isOfficeWifi && wifiStrength >= WIFI_THRESHOLD && styles.checkoutBtn
              ]}
              onPress={triggerVerification}
              disabled={isVerifying || !isOfficeWifi || wifiStrength < WIFI_THRESHOLD}
            >
              <Text style={styles.btnText}>
                {isVerifying ? "Verifying..." : isCheckout ? "Confirm Checkout" : "Confirm Presence"}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View style={styles.successContainer}>
          <SuccessAnimation isCheckout={isCheckout} />
          {attendanceDetails && (
            <View style={styles.detailsContainer}>
              <Text style={styles.detailsText}>
                {attendanceDetails.isCheckout
                  ? '👋 Checkout Complete!'
                  : attendanceDetails.isNewUser
                    ? '🆕 New Registration!'
                    : '✅ Attendance Marked'}
              </Text>
              <Text style={styles.detailsText}>{attendanceDetails.message}</Text>
              <Text style={styles.detailsText}>
                🕒 {new Date(attendanceDetails.timestamp).toLocaleTimeString()}
              </Text>
              <Text style={styles.detailsText}>
                📅 {new Date(attendanceDetails.timestamp).toLocaleDateString()}
              </Text>
              {attendanceDetails.placeName && (
                <Text style={styles.detailsText}>
                  📍 {attendanceDetails.placeName}
                </Text>
              )}
              {attendanceDetails.userId && (
                <Text style={styles.idText}>ID: {attendanceDetails.userId.slice(0, 8)}...</Text>
              )}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  permissionText: { color: '#fff', fontSize: 16, marginBottom: 20, textAlign: 'center', paddingHorizontal: 20 },
  uiLayer: { position: 'absolute', bottom: 50, width: '100%', alignItems: 'center' },
  instruction: { color: '#fff', fontSize: 16, marginBottom: 20 },
  actionBtn: { backgroundColor: '#007AFF', padding: 20, borderRadius: 50, width: '80%' },
  actionBtnDisabled: { backgroundColor: '#555' },
  checkoutBtn: { backgroundColor: '#FF6B6B' },
  btnText: { color: '#fff', textAlign: 'center', fontWeight: 'bold', fontSize: 18 },
  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  detailsContainer: { marginTop: 20, alignItems: 'center' },
  detailsText: { color: '#fff', fontSize: 16, marginVertical: 4, fontWeight: '500' },
  idText: { color: '#888', fontSize: 12, marginTop: 10 },
  wifiHint: { color: '#FF6B6B', fontSize: 14, marginBottom: 15, textAlign: 'center' as const },
  debugText: { color: '#888', fontSize: 10, marginBottom: 10, textAlign: 'center' as const }
});