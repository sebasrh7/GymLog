import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Vibration } from 'react-native';
import { useColors } from '../utils/ThemeContext';
import { useTimer } from '../hooks';

interface Props {
  visible: boolean;
  duracion: number;
  onFinish: () => void;
  onSkip: () => void;
}

export const TimerModal: React.FC<Props> = ({ visible, duracion, onFinish, onSkip }) => {
  const { colors } = useColors();
  const { segundos, activo, porcentaje, iniciar, detener } = useTimer(duracion);

  useEffect(() => {
    if (visible) iniciar(duracion);
    else detener();
  }, [visible, duracion, iniciar, detener]);

  useEffect(() => {
    if (visible && !activo && segundos === 0) {
      Vibration.vibrate([0, 300, 200, 300, 200, 300]);
      onFinish();
    }
  }, [activo, segundos, visible, onFinish]);

  const mins = Math.floor(segundos / 60);
  const secs = segundos % 60;
  const display = mins > 0
    ? `${mins}:${String(secs).padStart(2, '0')}`
    : `${segundos}`;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.textMuted }]}>Descanso</Text>
          <Text style={[styles.time, { color: colors.text }]}>{display}</Text>
          {mins === 0 && <Text style={[styles.unit, { color: colors.textMuted }]}>segundos</Text>}

          <View style={[styles.progressBg, { backgroundColor: colors.bg }]}>
            <View style={[styles.progressFill, { width: `${porcentaje * 100}%`, backgroundColor: colors.accent }]} />
          </View>

          <TouchableOpacity style={[styles.btnSkip, { borderColor: colors.border }]} onPress={onSkip} activeOpacity={0.85}>
            <Text style={[styles.btnSkipText, { color: colors.textMuted }]}>Saltar descanso</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    borderRadius: 40,
    padding: 40,
    alignItems: 'center',
    width: '82%',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  time: {
    fontSize: 80,
    fontWeight: '800',
    fontStyle: 'italic',
    lineHeight: 88,
    fontFamily: 'Menlo',
  },
  unit: {
    fontSize: 16,
    marginTop: -4,
    marginBottom: 8,
  },
  progressBg: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    marginTop: 24,
    marginBottom: 32,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
  },
  btnSkip: {
    borderWidth: 1,
    borderRadius: 40,
    paddingVertical: 13,
    paddingHorizontal: 28,
  },
  btnSkipText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
