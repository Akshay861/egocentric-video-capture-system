import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { BootstrapStatusScreen } from './src/screens/BootstrapStatusScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { bootstrapApp } from './src/services/bootstrap';

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
        title="Restoring session"
        message="Checking secure storage for an existing worker session."
      />
    );
  }

  if (status === 'unauthenticated') {
    return <LoginScreen />;
  }

  return <HomeScreen />;
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
        const message = error instanceof Error ? error.message : 'Unknown startup error';
        setBootstrapState({ loading: false, ready: false, error: message });
      }
    })();
  }, []);

  if (bootstrapState.loading) {
    return (
      <>
        <BootstrapStatusScreen
          title="Bootstrapping system"
          message="Preparing local database and core services."
        />
        <StatusBar style="light" />
      </>
    );
  }

  if (bootstrapState.error) {
    return (
      <>
        <BootstrapStatusScreen
          title="Startup failed"
          message={`Initialization failed: ${bootstrapState.error}`}
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
