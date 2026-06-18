import { Alert } from 'react-native';

export function showAlert(title: string, message: string): void {
  Alert.alert(title, message);
}

export function showConfirm(
  title: string,
  message: string,
  onConfirm: () => void,
  options?: { confirmLabel?: string; cancelLabel?: string; destructive?: boolean }
): void {
  Alert.alert(title, message, [
    { text: options?.cancelLabel ?? 'Cancel', style: 'cancel' },
    {
      text: options?.confirmLabel ?? 'OK',
      style: options?.destructive ? 'destructive' : 'default',
      onPress: onConfirm,
    },
  ]);
}
