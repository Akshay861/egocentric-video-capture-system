import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '../context/AuthContext';

export function HomeScreen() {
  const { session, workerId, logout } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Session Active</Text>
      <Text style={styles.label}>Worker ID</Text>
      <Text style={styles.value}>{workerId}</Text>

      <Text style={styles.label}>Login method</Text>
      <Text style={styles.value}>
        {session?.identifierType}: {session?.identifier}
      </Text>

      <Text style={styles.note}>
        Every recorded video will use this worker ID. Next step: video capture screen.
      </Text>

      <Pressable style={styles.logoutButton} onPress={() => void logout()}>
        <Text style={styles.logoutText}>Logout</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 72,
    backgroundColor: '#0B1220',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F9FAFB',
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: '#F3F4F6',
    marginBottom: 16,
  },
  note: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    color: '#9CA3AF',
  },
  logoutButton: {
    marginTop: 32,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  logoutText: {
    color: '#F9FAFB',
    fontWeight: '600',
  },
});
