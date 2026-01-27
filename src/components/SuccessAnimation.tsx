import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import LottieView from 'lottie-react-native'; // Standard for 2026 apps

interface SuccessAnimationProps {
  isCheckout?: boolean;
}

export default function SuccessAnimation({ isCheckout = false }: SuccessAnimationProps) {
  return (
    <View style={styles.container}>
      <LottieView
        source={isCheckout
          ? require('../../assets/checkout-check.json')
          : require('../../assets/success-check.json')
        }
        autoPlay
        loop={false}
        style={styles.animation}
      />
      <Text style={[styles.text, isCheckout && styles.checkoutText]}>
        {isCheckout ? 'Checkout Complete! 👋' : 'Attendance Marked! ✅'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', padding: 20 },
  animation: { width: 200, height: 200 },
  text: { fontSize: 22, fontWeight: 'bold', color: '#4CAF50', marginTop: 10 },
  checkoutText: { color: '#FF6B6B' } // Red color for checkout
});