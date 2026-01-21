import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const FaceScanOverlay = () => {
  return (
    <View style={styles.container}>
      <Text>Face Scan Overlay</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'blue',
  },
});
