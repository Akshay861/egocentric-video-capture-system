import { StyleSheet, Text, View } from 'react-native';

import type { UploadState } from '../types/video';
import { UPLOAD_STATE_COLORS, UPLOAD_STATE_LABELS } from '../utils/uploadState';

type UploadKpiGridProps = {
  counts: Record<UploadState, number>;
};

const KPI_ORDER: UploadState[] = ['pending', 'uploading', 'uploaded', 'failed'];

const KPI_HINTS: Record<UploadState, string> = {
  pending: 'Waiting to upload',
  uploading: 'Sending now',
  uploaded: 'On cloud',
  failed: 'Needs retry',
};

export function UploadKpiGrid({ counts }: UploadKpiGridProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Cloud upload status</Text>
      <View style={styles.grid}>
        {KPI_ORDER.map((state) => {
          const colors = UPLOAD_STATE_COLORS[state];
          return (
            <View
              key={state}
              style={[styles.card, { backgroundColor: colors.background }]}
            >
              <Text style={[styles.count, { color: colors.text }]}>{counts[state]}</Text>
              <Text style={[styles.label, { color: colors.text }]}>{UPLOAD_STATE_LABELS[state]}</Text>
              <Text style={[styles.hint, { color: colors.text }]}>{KPI_HINTS[state]}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#E5E7EB',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  card: {
    width: '48%',
    borderRadius: 12,
    padding: 12,
  },
  count: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 2,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
  },
  hint: {
    fontSize: 11,
    marginTop: 2,
    opacity: 0.85,
  },
});
