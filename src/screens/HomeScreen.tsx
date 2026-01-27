import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { AuthService } from '../services/AuthService';

export default function HomeScreen({ navigation, route }: any) {
  const userId = route?.params?.userId as string | undefined;
  const officeId = route?.params?.officeId as string | undefined;
  const userName = route?.params?.userName as string | undefined;
  const isCheckedIn = route?.params?.isCheckedIn as boolean | undefined;

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const handleLogout = async () => {
    try {
      await AuthService.signOut();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error: any) {
      Alert.alert('Logout Failed', error.message || 'Unable to logout');
    }
  };

  const displayName = userName || 'Employee';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>OfficeFlow</Text>
          <Text style={styles.subtitle}>{getGreeting()}, {displayName}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {isCheckedIn ? (
          <TouchableOpacity
            style={[styles.mainButton, styles.checkoutButton]}
            onPress={() => navigation.navigate('Verification', { userId, officeId, userName, isCheckout: true })}
          >
            <Text style={styles.buttonText}>Check-Out Now</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.mainButton}
            onPress={() => navigation.navigate('Verification', { userId, officeId, userName, isCheckout: false })}
          >
            <Text style={styles.buttonText}>Check-In Now</Text>
          </TouchableOpacity>
        )}
      </View>

      {isCheckedIn && (
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>✅ You are checked in</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  header: {
    padding: 30,
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  title: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 18, color: '#aaa', marginTop: 5 },
  logoutButton: {
    backgroundColor: '#FF4444',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 5
  },
  logoutText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600'
  },
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
  checkoutButton: {
    backgroundColor: '#FF6B6B',
    shadowColor: '#FF6B6B',
  },
  buttonText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  statusContainer: {
    padding: 20,
    alignItems: 'center',
    marginBottom: 30
  },
  statusText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600'
  }
});
