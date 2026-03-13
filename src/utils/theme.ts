import { StyleSheet } from 'react-native';

export const COLORS = {
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

export const FONTS = {
  regular: { color: COLORS.text, fontSize: 15 },
  bold: { color: COLORS.text, fontSize: 15, fontWeight: '700' as const },
  title: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '800' as const,
    fontStyle: 'italic' as const,
  },
  muted: { color: COLORS.textMuted, fontSize: 13 },
  mono: { fontFamily: 'Menlo', fontSize: 15 },
};

export const CARD = {
  backgroundColor: COLORS.bgCard,
  borderRadius: 40,
  padding: 16,
  marginBottom: 12,
  borderWidth: 1,
  borderColor: COLORS.border,
};

export const PRESS_STYLE = {
  activeOpacity: 0.85,
};

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  btnPrimary: {
    backgroundColor: COLORS.accent,
    borderRadius: 40,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: COLORS.accent,
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  btnPrimaryText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  input: {
    backgroundColor: COLORS.bgInput,
    color: COLORS.text,
    borderRadius: 40,
    paddingHorizontal: 20,
    paddingVertical: 14,
    fontSize: 15,
  },
  label: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginBottom: 6,
  },
});
