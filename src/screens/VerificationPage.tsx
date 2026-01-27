import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, Alert, TouchableOpacity } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import FaceScanOverlay from '../components/FaceScanOverlay';
import SignalMeter from '../components/SignalMeter';
import SuccessAnimation from '../components/SuccessAnimation';
import { NetworkService } from '../services/NetworkService';
import { FaceService } from '../services/FaceService';

// WiFi threshold must match backend (80% - room strength)
const WIFI_THRESHOLD = 80;

export default function VerificationPage({ navigation, route }: any) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [wifiStrength, setWifiStrength] = useState(0);
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
    return () => sub.remove();
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

  const triggerVerification = async () => {
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
      Alert.alert('Error', e?.message ?? 'Unable to verify attendance.');
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
              {wifiStrength < WIFI_THRESHOLD
                ? `WiFi: ${wifiStrength}% (Need ${WIFI_THRESHOLD}%)`
                : isCheckout ? 'Ready to scan face for checkout' : 'Ready to scan face'}
            </Text>
            <TouchableOpacity
              style={[
                styles.actionBtn,
                wifiStrength < WIFI_THRESHOLD && styles.actionBtnDisabled,
                isCheckout && styles.checkoutBtn
              ]}
              onPress={triggerVerification}
              disabled={isVerifying || wifiStrength < WIFI_THRESHOLD}
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
  idText: { color: '#888', fontSize: 12, marginTop: 10 }
});
