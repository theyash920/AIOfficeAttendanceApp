import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FaceScanOverlay } from '../components/FaceScanOverlay';
import { SignalMeter } from '../components/SignalMeter';

export const VerificationPage = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verification Page</Text>
      <FaceScanOverlay />
      <SignalMeter />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    marginBottom: 20,
  },
});
