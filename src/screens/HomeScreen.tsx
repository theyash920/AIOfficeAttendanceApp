import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';

export default function HomeScreen({ navigation, route }: any) {
  const userId = route?.params?.userId as string | undefined;
  const officeId = route?.params?.officeId as string | undefined;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>OfficeFlow</Text>
        <Text style={styles.subtitle}>Good Morning, Employee</Text>
      </View>

      <View style={styles.content}>
        <TouchableOpacity 
          style={styles.mainButton} 
          onPress={() => navigation.navigate('Verification', { userId, officeId })}
        >
          <Text style={styles.buttonText}>Check-In Now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  header: { padding: 30, marginTop: 40 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 18, color: '#aaa', marginTop: 5 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  mainButton: { 
    width: 250, 
    height: 250, 
    borderRadius: 125, 
    backgroundColor: '#007AFF', 
    justifyContent: 'center', 
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#007AFF',
    shadowOpacity: 0.5,
    shadowRadius: 20
  },
  buttonText: { color: '#fff', fontSize: 20, fontWeight: 'bold' }
});
