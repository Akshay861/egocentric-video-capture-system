import { useState } from 'react';

import { CaptureScreen } from '../screens/CaptureScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { VideoDashboardScreen } from '../screens/VideoDashboardScreen';

export type AppScreen = 'home' | 'capture' | 'dashboard';

export function AppNavigator() {
  const [screen, setScreen] = useState<AppScreen>('home');

  if (screen === 'capture') {
    return <CaptureScreen onBack={() => setScreen('home')} />;
  }

  if (screen === 'dashboard') {
    return <VideoDashboardScreen onBack={() => setScreen('home')} />;
  }

  return (
    <HomeScreen
      onOpenCapture={() => setScreen('capture')}
      onOpenDashboard={() => setScreen('dashboard')}
    />
  );
}
