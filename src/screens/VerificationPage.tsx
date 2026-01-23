import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, Alert, TouchableOpacity } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as LocalAuthentication from 'expo-local-authentication';
import FaceScanOverlay from '../components/FaceScanOverlay';
import SignalMeter from '../components/SignalMeter';
import SuccessAnimation from '../components/SuccessAnimation';
import { NetworkService } from '../services/NetworkService';
import { AttendanceAPI } from '../api/AttendanceAPI';

export default function VerificationPage({ navigation, route }: any) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [wifiStrength, setWifiStrength] = useState(0);
  const [permission, requestPermission] = useCameraPermissions();
  const userId = route?.params?.userId as string | undefined;
  const officeId = (route?.params?.officeId as string | undefined) ?? 'OFFICE_MOCK_01';

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

  const triggerVerification = async () => {
    if (!userId) {
      Alert.alert('Missing User', 'Please login again.');
      navigation.navigate('Login');
      return;
    }

    if (wifiStrength < 70) {
      Alert.alert('Weak Signal', 'Please move closer to the office gate.');
      return;
    }

    const ssid = await NetworkService.getCurrentSSID();
    if (ssid !== 'Office_WiFi_Mock') {
      Alert.alert('Wrong Network', 'Please connect to the office Wi‑Fi (mock).');
      return;
    }

    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    if (!hasHardware || !isEnrolled) {
      Alert.alert('Biometrics Unavailable', 'No biometrics configured on this device.');
      return;
    }

    setIsVerifying(true);
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Confirm your presence',
        cancelLabel: 'Cancel'
      });

      if (!result.success) {
        Alert.alert('Verification Failed', 'Biometric check was not successful.');
        return;
      }

      const confidence = Math.max(70, Math.min(100, wifiStrength));
      await AttendanceAPI.logAttendance(userId, officeId ?? 'OFFICE_MOCK_01', confidence);

      setIsSuccess(true);
      setTimeout(() => navigation.navigate('Home', { userId, officeId }), 2500);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Unable to verify attendance.');
    } finally {
      setIsVerifying(false);
    }
  };

  if (!permission) {
    // Camera permissions are still loading
    return <View style={styles.loader}><Text>Loading Camera...</Text></View>;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet
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
          <CameraView style={StyleSheet.absoluteFill} facing="front" />
          <FaceScanOverlay />
          <View style={styles.uiLayer}>
            <SignalMeter strength={wifiStrength} />
            <Text style={styles.instruction}>Center your face and hold still</Text>
            <TouchableOpacity 
              style={styles.actionBtn} 
              onPress={triggerVerification}
              disabled={isVerifying}
            >
              <Text style={styles.btnText}>{isVerifying ? "Verifying..." : "Confirm Presence"}</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <SuccessAnimation />
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
  btnText: { color: '#fff', textAlign: 'center', fontWeight: 'bold', fontSize: 18 }
});

