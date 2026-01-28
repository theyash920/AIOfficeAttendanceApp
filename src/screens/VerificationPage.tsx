import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, Alert, TouchableOpacity } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
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

  useEffect(() => {
    NetworkService.requestPermission().then((granted: boolean) => {
      if (!granted) {
        Alert.alert('Permission Required', 'Location permission is needed to read Wi‑Fi details.');
      }
    }).catch(() => {
      Alert.alert('Permission Error', 'Unable to request Wi‑Fi permission.');
    });

    const sub = NetworkService.observeWifi((strength: number) => setWifiStrength(strength));

    // Check BSSID periodically
    const checkBSSID = async () => {
      const bssid = await NetworkService.getCurrentBSSID();
      setCurrentBSSID(bssid.toUpperCase());
    };
    checkBSSID();
    const bssidInterval = setInterval(checkBSSID, 3000);

    return () => {
      sub.remove();
      clearInterval(bssidInterval);
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
    isCheckout?: boolean;
  } | null>(null);

  // Check if connected to office WiFi
  const isOfficeWifi = currentBSSID === OfficeSignatures.BSSID.toUpperCase();

  const triggerVerification = async () => {
    // Check BSSID first
    if (!isOfficeWifi) {
      Alert.alert(
        'Wrong Network',
        'You must be connected to the office WiFi to mark attendance. Please connect to the office network and try again.'
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
          Alert.alert('Face Not Found', result.message);
        } else {
          Alert.alert('Error', result.message || 'Unknown error occurred.');
        }
        return;
      }

      // Success! (Either registered new user, marked attendance, or checkout)
      setIsSuccess(true);
      setAttendanceDetails({
        userId: result.user_id,
        userName: result.user_name,
        isNewUser: result.is_new_user,
        timestamp: result.timestamp,
        message: result.message,
        location: result.location,
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
      console.error('[VerificationPage] Error:', e);

      // Check if it's a network error or backend error indicating user is outside office
      const errorMessage = e?.message?.toLowerCase() || '';

      // Network errors (can't reach backend server)
      const isNetworkError =
        errorMessage.includes('network request failed') ||
        errorMessage.includes('network error') ||
        errorMessage.includes('failed to fetch') ||
        errorMessage.includes('connection refused') ||
        errorMessage.includes('timeout') ||
        errorMessage.includes('unable to resolve host') ||
        errorMessage.includes('econnrefused') ||
        (e?.name === 'TypeError' && errorMessage.includes('network'));

      // Backend errors that typically occur when user is outside office
      // (face not matching due to different environment/lighting, or DB constraint errors)
      const isBackendError =
        errorMessage.includes('backend error: 500') ||
        errorMessage.includes('foreign key constraint') ||
        errorMessage.includes('violates foreign key') ||
        errorMessage.includes('not present in table');

      if (isNetworkError || isBackendError) {
        Alert.alert(
          '📍 Not in Office',
          'You are not in the office or the verification failed.\n\nPlease go to the office, connect to the office Wi-Fi, and try again.',
          [{ text: 'OK', style: 'default' }]
        );
      } else {
        Alert.alert('Error', e?.message ?? 'Unable to verify attendance.');
      }
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
              {attendanceDetails.location && (
                <Text style={styles.detailsText}>
                  📍 {attendanceDetails.location.latitude.toFixed(4)}, {attendanceDetails.location.longitude.toFixed(4)}
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
  wifiHint: { color: '#FF6B6B', fontSize: 14, marginBottom: 15, textAlign: 'center' as const }
});
