import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import LottieView from 'lottie-react-native'; // Standard for 2026 apps

export default function SuccessAnimation() {
  return (
    <View style={styles.container}>
      <LottieView
        source={require('../../assets/success-check.json')}
        autoPlay
        loop={false}
        style={styles.animation}
      />
      <Text style={styles.text}>Attendance Marked!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', padding: 20 },
  animation: { width: 200, height: 200 },
  text: { fontSize: 22, fontWeight: 'bold', color: '#4CAF50', marginTop: 10 }
});