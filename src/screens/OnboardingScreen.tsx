// src/screens/OnboardingScreen.tsx
import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { FaceService } from '../services/FaceService';

export default function OnboardingScreen({ navigation, route }: any) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const userId = route?.params?.userId as string | undefined;
  const officeId = (route?.params?.officeId as string | undefined) ?? 'OFFICE_MOCK_01';
  const userName = route?.params?.userName as string | undefined;

  React.useEffect(() => {
    checkExistingRegistration();
  }, []);

  const checkExistingRegistration = async () => {
    if (!userId) return;
    try {
      const employee = await FaceService.getEmployee(userId).catch(() => null);
      if (employee?.face_embedding) {
        Alert.alert(
          'Already Registered',
          'You already have a Digital ID. Proceeding to home.',
          [{ text: 'OK', onPress: () => navigation.replace('Home', { userId, officeId, userName }) }]
        );
      }
    } catch (e) {
      // Ignore errors here, just let them register
    }
  };

  const handleTakePhoto = async () => {
    if (!cameraRef.current) return;
    if (!userId) {
      Alert.alert('Missing User', 'Please login again.');
      navigation.navigate('Login');
      return;
    }

    try {
      setIsProcessing(true);
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7, base64: false });

      if (!photo?.uri) {
        throw new Error('Failed to capture photo');
      }

      console.log('[Onboarding] Photo taken:', photo.uri);

      const success = await FaceService.uploadInitialFace(userId, photo.uri, officeId);

      if (success) {
        Alert.alert('Profile Created!', 'Face enrollment successful.');
        navigation.navigate('Home', { userId, officeId, userName });
      }
    } catch (error: any) {
      console.error('[Onboarding] Registration error:', error);
      Alert.alert('Registration Failed', error?.message || 'Failed to save face data.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!permission) {
    return <View style={styles.container}><Text style={styles.text}>Loading Camera...</Text></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>We need camera permission to register your face.</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create your Digital ID</Text>
      <Text style={styles.subtitle}>
        Position your face in the center and take a photo.
      </Text>

      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="front"
        />
      </View>

      <TouchableOpacity
        style={[styles.button, isProcessing && styles.buttonDisabled]}
        onPress={handleTakePhoto}
        disabled={isProcessing}
      >
        <Text style={styles.buttonText}>{isProcessing ? 'Saving...' : 'Take Photo & Register'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 24, justifyContent: 'center', alignItems: 'center' },
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  subtitle: { color: '#aaa', marginBottom: 30, textAlign: 'center' },
  text: { color: '#fff', textAlign: 'center', marginBottom: 20 },
  cameraContainer: { width: 300, height: 300, borderRadius: 150, overflow: 'hidden', marginBottom: 30, borderWidth: 2, borderColor: '#007AFF' },
  camera: { flex: 1 },
  button: { backgroundColor: '#007AFF', paddingVertical: 14, paddingHorizontal: 40, borderRadius: 12 },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', textAlign: 'center', fontWeight: 'bold', fontSize: 16 }
});