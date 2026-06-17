import { useState } from 'react';

import { CaptureScreen } from './CaptureScreen';
import { HomeScreen } from './HomeScreen';

export type AppScreen = 'home' | 'capture';

export function AppNavigator() {
  const [screen, setScreen] = useState<AppScreen>('home');

  if (screen === 'capture') {
    return <CaptureScreen onBack={() => setScreen('home')} />;
  }

  return <HomeScreen onOpenCapture={() => setScreen('capture')} />;
}
