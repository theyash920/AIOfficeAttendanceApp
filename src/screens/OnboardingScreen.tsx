// src/screens/OnboardingScreen.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { FaceService } from '../services/FaceService';

export default function OnboardingScreen({ navigation, route }: any) {
  const [isProcessing, setIsProcessing] = useState(false);
  const userId = route?.params?.userId as string | undefined;
  const officeId = (route?.params?.officeId as string | undefined) ?? 'OFFICE_MOCK_01';

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
          [{ text: 'OK', onPress: () => navigation.replace('Home', { userId, officeId }) }]
        );
      }
    } catch (e) {
      // Ignore errors here, just let them register
    }
  };


  const handleRegisterFace = async () => {
    if (!userId) {
      Alert.alert('Missing User', 'Please login again.');
      navigation.navigate('Login');
      return;
    }

    try {
      setIsProcessing(true);
      console.log('[Onboarding] Starting face registration for userId:', userId);

      const mockEmbedding: number[] = Array.from({ length: 32 }, () => Math.round(Math.random() * 1000) / 1000);
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout - please check your network connection')), 10000)
      );
      
      const uploadPromise = FaceService.uploadInitialFace(userId, { embedding: mockEmbedding, method: 'mock' }, officeId);
      
      const success = await Promise.race([uploadPromise, timeoutPromise]);
      console.log('[Onboarding] Face registration success:', success);

      if (success) {
        Alert.alert('Profile Created!', 'Face enrollment saved (mock).');
        navigation.navigate('Home', { userId, officeId });
      } else {
        throw new Error('Upload failed without error');
      }
    } catch (error: any) {
      console.error('[Onboarding] Face registration error:', error);
      Alert.alert(
        'Registration Failed',
        error?.message || 'Failed to save face data. Please try again.'
      );
    } finally {
      console.log('[Onboarding] Resetting processing state');
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create your Digital ID</Text>
      <Text style={styles.subtitle}>
        For now we store a mock face embedding in Supabase to complete onboarding.
      </Text>

      <TouchableOpacity style={[styles.button, isProcessing && styles.buttonDisabled]} onPress={handleRegisterFace} disabled={isProcessing}>
        <Text style={styles.buttonText}>{isProcessing ? 'Saving...' : 'Register My Face'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 24, justifyContent: 'center' },
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  subtitle: { color: '#aaa', marginTop: 10, lineHeight: 18 },
  button: { backgroundColor: '#007AFF', paddingVertical: 14, borderRadius: 12, marginTop: 18 },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' }
});