import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, Alert, TouchableOpacity } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import FaceScanOverlay from '../components/FaceScanOverlay';
import SignalMeter from '../components/SignalMeter';
import SuccessAnimation from '../components/SuccessAnimation';
import { NetworkService } from '../services/NetworkService';

export default function VerificationPage({ navigation }: any) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [wifiStrength, setWifiStrength] = useState(0);
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    const sub = NetworkService.observeWifi((strength: number) => setWifiStrength(strength));
    return () => sub.remove();
  }, []);

  const triggerVerification = async () => {
    if (wifiStrength < 70) {
      Alert.alert("Weak Signal", "Please move closer to the office gate.");
      return;
    }

    setIsVerifying(true);
    // Simulating the Face ID + Backend check
    setTimeout(() => {
      setIsVerifying(false);
      setIsSuccess(true);
      // Auto-return home after success
      setTimeout(() => navigation.navigate('Home'), 3000);
    }, 2500);
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

