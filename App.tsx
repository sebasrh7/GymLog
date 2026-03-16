import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import RNFS from 'react-native-fs';
import { AppNavigator } from './src/navigation/AppNavigator';
import { ThemeProvider } from './src/utils/ThemeContext';
import { UnidadProvider } from './src/utils/UnidadContext';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { ToastProvider } from './src/components/Toast';
import { WelcomeScreen } from './src/screens/WelcomeScreen';
import { getDatabase } from './src/database/database';
import { COLORS } from './src/utils/theme';

const ONBOARDING_FLAG = `${RNFS.DocumentDirectoryPath}/onboarding_done.txt`;

const AppContent = () => {
  const [loading, setLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        await getDatabase();
        const exists = await RNFS.exists(ONBOARDING_FLAG);
        if (!exists) {
          setShowWelcome(true);
        }
      } catch (err) {
        console.error('Error iniciando app:', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleWelcomeComplete = async () => {
    await RNFS.writeFile(ONBOARDING_FLAG, '1', 'utf8').catch(() => {});
    setShowWelcome(false);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg }}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  if (showWelcome) {
    return <WelcomeScreen onComplete={handleWelcomeComplete} />;
  }

  return <AppNavigator />;
};

const App = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <UnidadProvider>
          <ToastProvider>
            <AppContent />
          </ToastProvider>
        </UnidadProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
