import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Rutina } from '../models';
import { COLORS } from '../utils/theme';
import { useColors } from '../utils/ThemeContext';
import { capitalize } from '../utils/formatters';

interface Props {
  rutina: Rutina;
  onPress: () => void;
  onIniciar: () => void;
  onEliminar: () => void;
}

export const RutinaCard: React.FC<Props> = ({
  rutina,
  onPress,
  onIniciar,
  onEliminar,
}) => {
  const { colors } = useColors();
  const numEjercicios = rutina.ejercicios?.length ?? 0;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* Top row: name + delete */}
      <View style={styles.topRow}>
        <View style={styles.nameBlock}>
          <Text style={[styles.nombre, { color: colors.text }]} numberOfLines={1}>
            {rutina.nombre}
          </Text>
          <View style={styles.metaRow}>
            {rutina.dia_semana ? (
              <View style={styles.badge}>
                <Text style={[styles.badgeText, { color: colors.accent }]}>
                  {capitalize(rutina.dia_semana)}
                </Text>
              </View>
            ) : null}
            {numEjercicios > 0 && (
              <Text style={[styles.meta, { color: colors.textDim }]}>
                {numEjercicios} ejercicio{numEjercicios > 1 ? 's' : ''}
              </Text>
            )}
          </View>
        </View>
        <TouchableOpacity
          style={[styles.btnEliminar, { backgroundColor: colors.bg }]}
          onPress={onEliminar}
          activeOpacity={0.85}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="trash-outline" size={16} color={colors.textDim} />
        </TouchableOpacity>
      </View>

      {/* Bottom: start button */}
      <TouchableOpacity
        style={[styles.btnIniciar, { backgroundColor: colors.accent }]}
        onPress={onIniciar}
        activeOpacity={0.85}
      >
        <Ionicons name="play" size={14} color="#FFF" />
        <Text style={styles.btnIniciarText}>Iniciar entrenamiento</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  nameBlock: {
    flex: 1,
    marginRight: 8,
  },
  nombre: {
    fontSize: 18,
    fontWeight: '800',
    fontStyle: 'italic',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  badge: {
    backgroundColor: 'rgba(255,0,0,0.1)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  meta: {
    fontSize: 12,
    fontFamily: 'Menlo',
  },
  btnIniciar: {
    borderRadius: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: COLORS.accent,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  btnIniciarText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
  btnEliminar: {
    borderRadius: 10,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
