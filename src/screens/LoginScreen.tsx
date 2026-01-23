import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthService } from '../services/AuthService';

type AuthMode = 'login' | 'signup';

export default function LoginScreen({ navigation }: any) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); 
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(1));

  const toggleMode = () => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0.3,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    setMode(mode === 'login' ? 'signup' : 'login');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFullName('');
  };

  const validateForm = (): string | null => {
    if (!email.trim()) return 'Please enter your email';
    if (!AuthService.validateEmail(email.trim())) return 'Please enter a valid email address';
    if (!password) return 'Please enter your password';
    if (password.length < 6) return 'Password must be at least 6 characters';

    if (mode === 'signup') {
      if (!fullName.trim()) return 'Please enter your full name';
      if (fullName.trim().length < 2) return 'Name must be at least 2 characters';
      if (!confirmPassword) return 'Please confirm your password';
      if (password !== confirmPassword) return 'Passwords do not match';
    }

    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      Alert.alert('Validation Error', validationError);
      return;
    }

    try {
      setLoading(true);

      if (mode === 'login') {
        await AuthService.handleLogin(email.trim(), password, navigation);
      } else {
        await AuthService.handleSignup(email.trim(), password, fullName.trim(), navigation);
      }
    } catch (e: any) {
      Alert.alert(
        mode === 'login' ? 'Login Failed' : 'Signup Failed',
        e?.message ?? 'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#0F0C29', '#302B63', '#24243e']}
        style={styles.gradient}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View style={[styles.formContainer, { opacity: fadeAnim }]}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.logo}>OfficeFlow</Text>
                <Text style={styles.subtitle}>
                  {mode === 'login' ? 'Welcome back!' : 'Create your account'}
                </Text>
              </View>

              {/* Glass Card */}
              <View style={styles.glassCard}>
                {/* Mode Tabs */}
                <View style={styles.tabContainer}>
                  <TouchableOpacity
                    style={[styles.tab, mode === 'login' && styles.activeTab]}
                    onPress={() => mode !== 'login' && toggleMode()}
                  >
                    <Text style={[styles.tabText, mode === 'login' && styles.activeTabText]}>
                      Login
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.tab, mode === 'signup' && styles.activeTab]}
                    onPress={() => mode !== 'signup' && toggleMode()}
                  >
                    <Text style={[styles.tabText, mode === 'signup' && styles.activeTabText]}>
                      Sign Up
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Form Fields */}
                <View style={styles.formFields}>
                  {mode === 'signup' && (
                    <View style={styles.inputContainer}>
                      <Text style={styles.label}>Full Name</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="John Doe"
                        placeholderTextColor="#8E8E93"
                        value={fullName}
                        onChangeText={setFullName}
                        autoCapitalize="words"
                      />
                    </View>
                  )}

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Email</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="you@example.com"
                      placeholderTextColor="#8E8E93"
                      value={email}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      onChangeText={setEmail}
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Password</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="••••••••"
                      placeholderTextColor="#8E8E93"
                      value={password}
                      secureTextEntry
                      onChangeText={setPassword}
                    />
                  </View>

                  {mode === 'signup' && (
                    <View style={styles.inputContainer}>
                      <Text style={styles.label}>Confirm Password</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="••••••••"
                        placeholderTextColor="#8E8E93"
                        value={confirmPassword}
                        secureTextEntry
                        onChangeText={setConfirmPassword}
                      />
                    </View>
                  )}

                  {/* Submit Button */}
                  <TouchableOpacity
                    style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={loading ? ['#555', '#666'] : ['#667eea', '#764ba2']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.buttonGradient}
                    >
                      <Text style={styles.submitButtonText}>
                        {loading
                          ? mode === 'login'
                            ? 'Signing in...'
                            : 'Creating account...'
                          : mode === 'login'
                          ? 'Sign In'
                          : 'Create Account'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Footer hint */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                </Text>
                <TouchableOpacity onPress={toggleMode}>
                  <Text style={styles.footerLink}>
                    {mode === 'login' ? 'Sign Up' : 'Login'}
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0C29',
  },
  gradient: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 1,
    textShadowColor: 'rgba(102, 126, 234, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#B8B8D1',
    marginTop: 8,
    fontWeight: '500',
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: 'rgba(102, 126, 234, 0.3)',
  },
  tabText: {
    color: '#8E8E93',
    fontSize: 15,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#fff',
  },
  formFields: {
    gap: 16,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    color: '#B8B8D1',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  submitButton: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    alignItems: 'center',
  },
  footerText: {
    color: '#8E8E93',
    fontSize: 14,
  },
  footerLink: {
    color: '#667eea',
    fontSize: 14,
    fontWeight: 'bold',
  },
});