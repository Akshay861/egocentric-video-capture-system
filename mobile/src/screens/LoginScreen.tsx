import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { appBranding } from '../config/branding';
import { useAuth } from '../context/AuthContext';
import type { IdentifierType } from '../types/auth';
import { toUserMessage, userMessages } from '../utils/userMessages';

export function LoginScreen() {
  const { login } = useAuth();
  const [identifierType, setIdentifierType] = useState<IdentifierType>('email');
  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async () => {
    setError(null);
    setSubmitting(true);

    try {
      await login(identifier, identifierType);
    } catch (loginError) {
      setError(toUserMessage(loginError, userMessages.login.genericFailure));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.appName}>{appBranding.name}</Text>
      <Text style={styles.title}>Welcome back</Text>
      <Text style={styles.subtitle}>
        Sign in with your work email or phone. Your session stays saved on this device.
      </Text>

      <View style={styles.toggleRow}>
        <Pressable
          style={[styles.toggleButton, identifierType === 'email' && styles.toggleButtonActive]}
          onPress={() => setIdentifierType('email')}
        >
          <Text
            style={[styles.toggleText, identifierType === 'email' && styles.toggleTextActive]}
          >
            Email
          </Text>
        </Pressable>
        <Pressable
          style={[styles.toggleButton, identifierType === 'phone' && styles.toggleButtonActive]}
          onPress={() => setIdentifierType('phone')}
        >
          <Text
            style={[styles.toggleText, identifierType === 'phone' && styles.toggleTextActive]}
          >
            Phone
          </Text>
        </Pressable>
      </View>

      <TextInput
        style={styles.input}
        value={identifier}
        onChangeText={setIdentifier}
        placeholder={identifierType === 'email' ? 'you@company.com' : '+919876543210'}
        placeholderTextColor="#6B7280"
        autoCapitalize="none"
        keyboardType={identifierType === 'email' ? 'email-address' : 'phone-pad'}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        style={[styles.loginButton, submitting && styles.loginButtonDisabled]}
        onPress={() => void handleLogin()}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.loginButtonText}>Continue to {appBranding.homeTitle}</Text>
        )}
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#0B1220',
  },
  appName: {
    color: '#60A5FA',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F9FAFB',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: '#9CA3AF',
    marginBottom: 24,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  toggleButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  toggleButtonActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#1E3A8A',
  },
  toggleText: {
    color: '#D1D5DB',
    fontWeight: '600',
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  input: {
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#F9FAFB',
    marginBottom: 12,
  },
  error: {
    color: '#F87171',
    marginBottom: 12,
    lineHeight: 20,
  },
  loginButton: {
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
});
