import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { BootstrapStatusScreen } from './src/screens/BootstrapStatusScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { bootstrapApp } from './src/services/bootstrap';
import { toUserMessage, userMessages } from './src/utils/userMessages';

type BootstrapState = {
  loading: boolean;
  ready: boolean;
  error: string | null;
};

function AppContent() {
  const { status } = useAuth();

  if (status === 'loading') {
    return (
      <BootstrapStatusScreen
        title={userMessages.startup.restoringSessionTitle}
        message={userMessages.startup.restoringSessionBody}
      />
    );
  }

  if (status === 'unauthenticated') {
    return <LoginScreen />;
  }

  return <AppNavigator />;
}

export default function App() {
  const [bootstrapState, setBootstrapState] = useState<BootstrapState>({
    loading: true,
    ready: false,
    error: null,
  });

  useEffect(() => {
    void (async () => {
      try {
        await bootstrapApp();
        setBootstrapState({ loading: false, ready: true, error: null });
      } catch (error) {
        const message = toUserMessage(error, userMessages.startup.failedBody);
        setBootstrapState({ loading: false, ready: false, error: message });
      }
    })();
  }, []);

  if (bootstrapState.loading) {
    return (
      <>
        <BootstrapStatusScreen
          title={userMessages.startup.bootstrappingTitle}
          message={userMessages.startup.bootstrappingBody}
        />
        <StatusBar style="light" />
      </>
    );
  }

  if (bootstrapState.error) {
    return (
      <>
        <BootstrapStatusScreen
          title={userMessages.startup.failedTitle}
          message={bootstrapState.error ?? userMessages.startup.failedBody}
        />
        <StatusBar style="light" />
      </>
    );
  }

  if (bootstrapState.ready) {
    return (
      <AuthProvider>
        <AppContent />
        <StatusBar style="light" />
      </AuthProvider>
    );
  }

  return null;
}
