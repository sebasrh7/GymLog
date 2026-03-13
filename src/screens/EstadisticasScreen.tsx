import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { sesionService } from '../services/sesionService';
import { COLORS, globalStyles } from '../utils/theme';
import { useColors } from '../utils/ThemeContext';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_WIDTH = SCREEN_WIDTH - 80;
const CHART_HEIGHT = 180;

export const EstadisticasScreen = () => {
  const route = useRoute<any>();
  const { colors } = useColors();
  const { ejercicioId, ejercicioNombre } = route.params;
  const [datos, setDatos] = useState<{ fecha: string; peso: number; reps: number }[]>([]);
  const [record, setRecord] = useState<{ peso: number; reps: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      const [historial, pr] = await Promise.all([
        sesionService.getHistorialEjercicio(ejercicioId),
        sesionService.getRecordPersonal(ejercicioId),
      ]);
      setDatos(historial);
      setRecord(pr);
      setLoading(false);
    };
    cargar();
  }, [ejercicioId]);

  if (loading) {
    return (
      <View style={globalStyles.center}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  const maxPeso = datos.length > 0 ? Math.max(...datos.map(d => d.peso)) : 0;
  const minPeso = datos.length > 0 ? Math.min(...datos.map(d => d.peso)) : 0;
  const range = maxPeso - minPeso || 1;

  const formatFechaCorta = (fecha: string) => {
    const d = new Date(fecha);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  };

  return (
    <View style={[globalStyles.container, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.nombre}>{ejercicioNombre}</Text>

        {/* Récord personal */}
        {record && (
          <View style={styles.prCard}>
            <Text style={styles.prLabel}>RÉCORD PERSONAL</Text>
            <View style={styles.prRow}>
              <View style={styles.prItem}>
                <Text style={styles.prValue}>{record.peso}</Text>
                <Text style={styles.prUnit}>kg</Text>
              </View>
              <Text style={styles.prSeparator}>×</Text>
              <View style={styles.prItem}>
                <Text style={styles.prValue}>{record.reps}</Text>
                <Text style={styles.prUnit}>reps</Text>
              </View>
            </View>
          </View>
        )}

        {/* Gráfico de progreso */}
        {datos.length >= 2 ? (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Peso máximo por sesión</Text>
            <View style={styles.chartContainer}>
              {/* Eje Y */}
              <View style={styles.yAxis}>
                <Text style={styles.axisLabel}>{maxPeso}</Text>
                <Text style={styles.axisLabel}>{Math.round((maxPeso + minPeso) / 2)}</Text>
                <Text style={styles.axisLabel}>{minPeso}</Text>
              </View>
              {/* Barras */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chartScroll}>
                <View style={styles.barsContainer}>
                  {datos.map((d, i) => {
                    const height = ((d.peso - minPeso) / range) * (CHART_HEIGHT - 30) + 20;
                    return (
                      <View key={i} style={styles.barWrapper}>
                        <Text style={styles.barValue}>{d.peso}</Text>
                        <View style={[styles.bar, { height }]} />
                        <Text style={styles.barLabel}>{formatFechaCorta(d.fecha)}</Text>
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          </View>
        ) : (
          <View style={styles.emptyChart}>
            <Text style={styles.emptyText}>
              {datos.length === 0
                ? 'Sin datos aún. Completa al menos una sesión.'
                : 'Se necesitan al menos 2 sesiones para ver el gráfico.'}
            </Text>
          </View>
        )}

        {/* Historial de sesiones */}
        {datos.length > 0 && (
          <View style={styles.historialCard}>
            <Text style={styles.chartTitle}>Historial</Text>
            {[...datos].reverse().map((d, i) => (
              <View key={i} style={styles.historialRow}>
                <Text style={styles.historialFecha}>{formatFechaCorta(d.fecha)}</Text>
                <Text style={styles.historialPeso}>{d.peso} kg</Text>
                <Text style={styles.historialReps}>{d.reps} reps</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  scroll: { padding: 24, paddingBottom: 40 },
  nombre: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '800',
    fontStyle: 'italic',
    marginBottom: 20,
  },
  prCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 40,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.warning,
  },
  prLabel: {
    color: COLORS.warning,
    fontSize: 12,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 1,
    marginBottom: 12,
  },
  prRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  prItem: {
    alignItems: 'center',
  },
  prValue: {
    color: COLORS.text,
    fontSize: 40,
    fontWeight: '800',
    fontFamily: 'Menlo',
  },
  prUnit: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginTop: -4,
  },
  prSeparator: {
    color: COLORS.textMuted,
    fontSize: 28,
    marginHorizontal: 20,
  },
  chartCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 40,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chartTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '800',
    fontStyle: 'italic',
    marginBottom: 16,
  },
  chartContainer: {
    flexDirection: 'row',
    height: CHART_HEIGHT,
  },
  yAxis: {
    width: 36,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: 8,
    paddingBottom: 20,
  },
  axisLabel: {
    color: COLORS.textDim,
    fontSize: 11,
    fontFamily: 'Menlo',
  },
  chartScroll: {
    flex: 1,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingBottom: 20,
  },
  barWrapper: {
    alignItems: 'center',
    width: 36,
  },
  bar: {
    width: 20,
    backgroundColor: COLORS.accent,
    borderRadius: 40,
    minHeight: 4,
  },
  barValue: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginBottom: 4,
    fontFamily: 'Menlo',
  },
  barLabel: {
    color: COLORS.textDim,
    fontSize: 10,
    marginTop: 6,
    fontFamily: 'Menlo',
  },
  emptyChart: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 40,
    padding: 32,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
  historialCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 40,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  historialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  historialFecha: {
    color: COLORS.textMuted,
    fontSize: 14,
    flex: 1,
    fontFamily: 'Menlo',
  },
  historialPeso: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    fontFamily: 'Menlo',
  },
  historialReps: {
    color: COLORS.textMuted,
    fontSize: 14,
    flex: 1,
    textAlign: 'right',
    fontFamily: 'Menlo',
  },
});
