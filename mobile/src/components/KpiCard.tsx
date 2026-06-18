import { StyleSheet, Text, View } from 'react-native';

type KpiCardProps = {
  label: string;
  value: string | number;
  hint?: string;
  accentColor?: string;
};

export function KpiCard({ label, value, hint, accentColor = '#3B82F6' }: KpiCardProps) {
  return (
    <View style={[styles.card, { borderTopColor: accentColor }]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: '#111827',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1F2937',
    borderTopWidth: 3,
    padding: 14,
  },
  label: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  value: {
    color: '#F9FAFB',
    fontSize: 28,
    fontWeight: '700',
  },
  hint: {
    marginTop: 4,
    color: '#6B7280',
    fontSize: 12,
  },
});
