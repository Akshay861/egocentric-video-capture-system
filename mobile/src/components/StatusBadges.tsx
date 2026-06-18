import { StyleSheet, Text, View } from 'react-native';

import {
  CLOUD_DISPLAY_COLORS,
  CLOUD_DISPLAY_LABELS,
  type CloudDisplayState,
  LOCAL_STORAGE_COLORS,
  LOCAL_STORAGE_LABELS,
  type LocalStorageState,
} from '../utils/uploadState';

type StatusBadgeProps = {
  label: string;
  colors: { background: string; text: string };
};

function StatusBadge({ label, colors }: StatusBadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: colors.background }]}>
      <Text style={[styles.text, { color: colors.text }]}>{label}</Text>
    </View>
  );
}

type LocalStatusBadgeProps = {
  state: LocalStorageState;
};

export function LocalStatusBadge({ state }: LocalStatusBadgeProps) {
  return <StatusBadge label={LOCAL_STORAGE_LABELS[state]} colors={LOCAL_STORAGE_COLORS[state]} />;
}

type CloudStatusBadgeProps = {
  state: CloudDisplayState;
};

export function CloudStatusBadge({ state }: CloudStatusBadgeProps) {
  return <StatusBadge label={CLOUD_DISPLAY_LABELS[state]} colors={CLOUD_DISPLAY_COLORS[state]} />;
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
  },
});
