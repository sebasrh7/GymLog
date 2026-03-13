import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../utils/theme';
import { useColors } from '../utils/ThemeContext';

interface Props {
  onComplete: () => void;
}

export const WelcomeScreen: React.FC<Props> = ({ onComplete }) => {
  const { colors, isDark } = useColors();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={styles.content}>
        {/* Logo */}
        <View style={[styles.logoCircle, { backgroundColor: colors.accent }]}>
          <Ionicons name="barbell" size={48} color="#FFF" />
        </View>

        <Text style={[styles.title, { color: colors.text }]}>GymLog</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Tu compañero de entrenamiento
        </Text>

        {/* Features */}
        <View style={styles.features}>
          <FeatureRow
            icon="create-outline"
            title="Crea rutinas personalizadas"
            description="Organiza ejercicios, series y pesos"
            colors={colors}
          />
          <FeatureRow
            icon="timer-outline"
            title="Entrena con control"
            description="Timer de descanso y seguimiento en vivo"
            colors={colors}
          />
          <FeatureRow
            icon="trending-up-outline"
            title="Mide tu progreso"
            description="Historial, estadísticas y récords personales"
            colors={colors}
          />
        </View>
      </View>

      <TouchableOpacity
        style={[styles.btn, { backgroundColor: colors.accent }]}
        onPress={onComplete}
        activeOpacity={0.85}
      >
        <Text style={styles.btnText}>Comenzar</Text>
        <Ionicons name="arrow-forward" size={20} color="#FFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const FeatureRow: React.FC<{
  icon: string;
  title: string;
  description: string;
  colors: any;
}> = ({ icon, title, description, colors }) => (
  <View style={styles.featureRow}>
    <View style={[styles.featureIcon, { backgroundColor: colors.bgCard }]}>
      <Ionicons name={icon} size={22} color={colors.accent} />
    </View>
    <View style={styles.featureText}>
      <Text style={[styles.featureTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.featureDesc, { color: colors.textMuted }]}>{description}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: COLORS.accent,
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 48,
  },
  features: {
    width: '100%',
    gap: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 13,
  },
  btn: {
    marginHorizontal: 24,
    marginBottom: 32,
    borderRadius: 18,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: COLORS.accent,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  btnText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
  },
});
