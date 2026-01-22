import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  strength: number; // 0 to 100
}

export default function SignalMeter({ strength }: Props) {
  const getColor = () => {
    if (strength > 75) return '#4CAF50'; // Strong
    if (strength > 40) return '#FFEB3B'; // Moderate
    return '#F44336'; // Weak
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Signal Stability:</Text>
      <View style={styles.track}>
        <View style={[styles.bar, { width: `${strength}%`, backgroundColor: getColor() }]} />
      </View>
      <Text style={styles.valueText}>{strength}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', padding: 20 },
  label: { color: '#fff', marginBottom: 5, fontWeight: 'bold' },
  track: { height: 10, backgroundColor: '#333', borderRadius: 5, overflow: 'hidden' },
  bar: { height: '100%' },
  valueText: { color: '#ccc', textAlign: 'right', marginTop: 5 }
});