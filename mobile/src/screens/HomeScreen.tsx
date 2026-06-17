import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '../context/AuthContext';
import { countVideosByWorker } from '../db/videoRepository';

type HomeScreenProps = {
  onOpenCapture: () => void;
};

export function HomeScreen({ onOpenCapture }: HomeScreenProps) {
  const { session, workerId, logout } = useAuth();
  const [savedVideoCount, setSavedVideoCount] = useState(0);

  useEffect(() => {
    if (!workerId) {
      return;
    }

    void (async () => {
      const total = await countVideosByWorker(workerId);
      setSavedVideoCount(total);
    })();
  }, [workerId]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Worker Dashboard</Text>

      <Text style={styles.label}>Worker ID</Text>
      <Text style={styles.value}>{workerId}</Text>

      <Text style={styles.label}>Login method</Text>
      <Text style={styles.value}>
        {session?.identifierType}: {session?.identifier}
      </Text>

      <Text style={styles.label}>Saved videos on this device</Text>
      <Text style={styles.value}>{savedVideoCount}</Text>

      <Pressable style={styles.primaryButton} onPress={onOpenCapture}>
        <Text style={styles.primaryButtonText}>Open video capture</Text>
      </Pressable>

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
  primaryButton: {
    marginTop: 12,
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  logoutButton: {
    marginTop: 16,
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
