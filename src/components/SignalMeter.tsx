import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const SignalMeter = () => {
  return (
    <View style={styles.container}>
      <Text>Signal Meter</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    backgroundColor: '#eee',
  },
});
