import React, { createContext, useContext, useState, useEffect } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import RNFS from 'react-native-fs';

const DARK = {
  bg: '#000000',
  bgCard: '#1C1C1E',
  bgInput: '#2C2C2E',
  accent: '#FF0000',
  accentLight: '#FF4444',
  text: '#FFFFFF',
  textMuted: '#8E8E93',
  textDim: '#48484A',
  border: 'rgba(255,255,255,0.05)',
  success: '#30D158',
  warning: '#FFD60A',
};

const LIGHT = {
  bg: '#F2F2F7',
  bgCard: '#FFFFFF',
  bgInput: '#E5E5EA',
  accent: '#FF0000',
  accentLight: '#FF4444',
  text: '#1C1C1E',
  textMuted: '#8E8E93',
  textDim: '#C7C7CC',
  border: 'rgba(0,0,0,0.05)',
  success: '#30D158',
  warning: '#FFD60A',
};

export type ThemeColors = typeof DARK;
export type ThemeMode = 'dark' | 'light' | 'system';

interface ThemeContextType {
  colors: ThemeColors;
  mode: ThemeMode;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
}

const PREF_PATH = `${RNFS.DocumentDirectoryPath}/theme_pref.txt`;

const ThemeContext = createContext<ThemeContextType>({
  colors: DARK,
  mode: 'system',
  isDark: true,
  setMode: () => {},
});

export const useColors = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<ThemeMode>('system');
  const systemScheme = Appearance.getColorScheme();

  useEffect(() => {
    RNFS.readFile(PREF_PATH, 'utf8')
      .then(m => { if (m === 'dark' || m === 'light' || m === 'system') setModeState(m); })
      .catch(() => {});
  }, []);

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    RNFS.writeFile(PREF_PATH, newMode, 'utf8').catch(() => {});
  };

  const resolvedDark = mode === 'system' ? systemScheme !== 'light' : mode === 'dark';
  const colors = resolvedDark ? DARK : LIGHT;

  return (
    <ThemeContext.Provider value={{ colors, mode, isDark: resolvedDark, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
};
