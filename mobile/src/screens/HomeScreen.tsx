import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { KpiCard } from '../components/KpiCard';
import { UploadKpiGrid } from '../components/UploadKpiGrid';
import { appBranding } from '../config/branding';
import { useAuth } from '../context/AuthContext';
import { countVideosByWorker } from '../db/videoRepository';
import { useUploadQueueStats } from '../hooks/useUploadQueueStats';

type HomeScreenProps = {
  onOpenCapture: () => void;
  onOpenDashboard: () => void;
};

export function HomeScreen({ onOpenCapture, onOpenDashboard }: HomeScreenProps) {
  const { session, workerId, logout } = useAuth();
  const { counts } = useUploadQueueStats(workerId);
  const [savedVideoCount, setSavedVideoCount] = useState(0);

  useEffect(() => {
    if (!workerId) {
      return;
    }

    void (async () => {
      const total = await countVideosByWorker(workerId);
      setSavedVideoCount(total);
    })();
  }, [workerId, counts]);

  const onCloudCount = counts.uploaded;
  const needsAttention = counts.failed + counts.pending;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.appName}>{appBranding.name}</Text>
      <Text style={styles.title}>{appBranding.homeTitle}</Text>
      <Text style={styles.subtitle}>{appBranding.tagline}</Text>

      <View style={styles.kpiRow}>
        <KpiCard
          label="Recordings"
          value={savedVideoCount}
          hint="Saved on this device"
          accentColor="#3B82F6"
        />
        <KpiCard
          label="On cloud"
          value={onCloudCount}
          hint="Uploaded successfully"
          accentColor="#10B981"
        />
      </View>

      <View style={styles.kpiRow}>
        <KpiCard
          label="Needs attention"
          value={needsAttention}
          hint="Pending or failed uploads"
          accentColor="#F59E0B"
        />
        <KpiCard
          label="Active uploads"
          value={counts.uploading}
          hint="In progress right now"
          accentColor="#8B5CF6"
        />
      </View>

      <UploadKpiGrid counts={counts} />

      <View style={styles.profileCard}>
        <Text style={styles.profileTitle}>Signed in as</Text>
        <Text style={styles.profileValue}>
          {session?.identifierType === 'email' ? session.identifier : session?.identifier}
        </Text>
        <Text style={styles.profileMeta}>Worker ID · {workerId?.slice(0, 12)}…</Text>
      </View>

      <Text style={styles.note}>
        Uploads run automatically in the background. If one fails, open the library and tap retry.
      </Text>

      <Pressable style={styles.primaryButton} onPress={onOpenCapture}>
        <Text style={styles.primaryButtonText}>Record new video</Text>
      </Pressable>

      <Pressable style={styles.secondaryButton} onPress={onOpenDashboard}>
        <Text style={styles.secondaryButtonText}>Open recording library</Text>
      </Pressable>

      <Pressable style={styles.logoutButton} onPress={() => void logout()}>
        <Text style={styles.logoutText}>Sign out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1220',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 32,
  },
  appName: {
    color: '#60A5FA',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#F9FAFB',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: '#9CA3AF',
    marginBottom: 20,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  profileCard: {
    backgroundColor: '#111827',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1F2937',
    padding: 16,
    marginBottom: 16,
  },
  profileTitle: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  profileValue: {
    color: '#F9FAFB',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  profileMeta: {
    color: '#6B7280',
    fontSize: 13,
  },
  note: {
    fontSize: 14,
    lineHeight: 20,
    color: '#9CA3AF',
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  secondaryButton: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#E5E7EB',
    fontWeight: '600',
    fontSize: 16,
  },
  logoutButton: {
    marginTop: 16,
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  logoutText: {
    color: '#9CA3AF',
    fontWeight: '600',
    fontSize: 14,
  },
});
