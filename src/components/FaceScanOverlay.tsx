import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function FaceScanOverlay() {
  return (
    <View style={styles.container}>
      {/* Semi-transparent background with a clear hole in the middle */}
      <View style={styles.overlayInner}>
        <View style={styles.faceCutout} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)', 
  },
  overlayInner: {
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.35,
    borderWidth: 3,
    borderColor: '#00FF00', // Green frame for high confidence
    backgroundColor: 'transparent',
  },
  faceCutout: {
    flex: 1,
  }
});
