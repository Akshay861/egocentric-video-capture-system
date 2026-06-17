import { StyleSheet, Text, View } from 'react-native';

type BootstrapStatusScreenProps = {
  title: string;
  message: string;
};

export function BootstrapStatusScreen({ title, message }: BootstrapStatusScreenProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    backgroundColor: '#0B1220',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#F9FAFB',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    color: '#D1D5DB',
  },
});
