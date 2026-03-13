import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Ejercicio } from '../models';
import { useColors } from '../utils/ThemeContext';
import { capitalize } from '../utils/formatters';

interface Props {
  ejercicio: Ejercicio;
  seleccionado?: boolean;
  onPress: () => void;
  onLongPress?: () => void;
}

export const EjercicioCard: React.FC<Props> = ({ ejercicio, seleccionado, onPress, onLongPress }) => {
  const { colors } = useColors();

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: colors.bgCard, borderColor: colors.border },
        seleccionado && { borderColor: colors.accent, backgroundColor: 'rgba(255,0,0,0.05)' },
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.85}
    >
      <View style={styles.info}>
        <Text style={[styles.nombre, { color: colors.text }]}>{ejercicio.nombre}</Text>
      </View>
      <View style={styles.rightSection}>
        <View style={[styles.grupoBadge, { backgroundColor: colors.bg }]}>
          <Text style={[styles.grupoBadgeText, { color: colors.textMuted }]}>
            {capitalize(ejercicio.grupo_muscular)}
          </Text>
        </View>
        {seleccionado && (
          <View style={[styles.checkCircle, { backgroundColor: colors.accent }]}>
            <Ionicons name="checkmark" size={14} color="#FFF" />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 14,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  info: { flex: 1 },
  nombre: {
    fontSize: 15,
    fontWeight: '700',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  grupoBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  grupoBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
