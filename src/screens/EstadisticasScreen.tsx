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
import { useUnidad } from '../utils/UnidadContext';
import { fromDb } from '../utils/conversion';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_HEIGHT = 180;

export const EstadisticasScreen = () => {
  const route = useRoute<any>();
  const { colors } = useColors();
  const { unidad } = useUnidad();
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
      <View style={[globalStyles.center, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  const maxPeso = datos.length > 0 ? Math.max(...datos.map(d => fromDb(d.peso, unidad))) : 0;
  const minPeso = datos.length > 0 ? Math.min(...datos.map(d => fromDb(d.peso, unidad))) : 0;
  const range = maxPeso - minPeso || 1;

  const formatFechaCorta = (fecha: string) => {
    const d = new Date(fecha);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  };

  return (
    <View style={[globalStyles.container, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.nombre, { color: colors.text }]}>{ejercicioNombre}</Text>

        {/* Récord personal */}
        {record && (
          <View style={[styles.prCard, { backgroundColor: colors.bgCard, borderColor: colors.warning }]}>
            <Text style={[styles.prLabel, { color: colors.warning }]}>RÉCORD PERSONAL</Text>
            <View style={styles.prRow}>
              <View style={styles.prItem}>
                <Text style={[styles.prValue, { color: colors.text }]}>{parseFloat(fromDb(record.peso, unidad).toFixed(1))}</Text>
                <Text style={[styles.prUnit, { color: colors.textMuted }]}>{unidad}</Text>
              </View>
              <Text style={[styles.prSeparator, { color: colors.textMuted }]}>×</Text>
              <View style={styles.prItem}>
                <Text style={[styles.prValue, { color: colors.text }]}>{record.reps}</Text>
                <Text style={[styles.prUnit, { color: colors.textMuted }]}>reps</Text>
              </View>
            </View>
          </View>
        )}

        {/* Gráfico de progreso */}
        {datos.length >= 2 ? (
          <View style={[styles.chartCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <Text style={[styles.chartTitle, { color: colors.text }]}>Peso máximo por sesión</Text>
            <View style={styles.chartContainer}>
              {/* Eje Y */}
              <View style={styles.yAxis}>
                <Text style={[styles.axisLabel, { color: colors.textDim }]}>{Math.round(maxPeso)}</Text>
                <Text style={[styles.axisLabel, { color: colors.textDim }]}>{Math.round((maxPeso + minPeso) / 2)}</Text>
                <Text style={[styles.axisLabel, { color: colors.textDim }]}>{Math.round(minPeso)}</Text>
              </View>
              {/* Barras */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chartScroll}>
                <View style={styles.barsContainer}>
                  {datos.map((d, i) => {
                    const pesoConv = fromDb(d.peso, unidad);
                    const height = ((pesoConv - minPeso) / range) * (CHART_HEIGHT - 30) + 20;
                    return (
                      <View key={i} style={styles.barWrapper}>
                        <Text style={[styles.barValue, { color: colors.textMuted }]}>{Math.round(pesoConv)}</Text>
                        <View style={[styles.bar, { height, backgroundColor: colors.accent }]} />
                        <Text style={[styles.barLabel, { color: colors.textDim }]}>{formatFechaCorta(d.fecha)}</Text>
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          </View>
        ) : (
          <View style={[styles.emptyChart, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              {datos.length === 0
                ? 'Sin datos aún. Completa al menos una sesión.'
                : 'Se necesitan al menos 2 sesiones para ver el gráfico.'}
            </Text>
          </View>
        )}

        {/* Historial de sesiones */}
        {datos.length > 0 && (
          <View style={[styles.historialCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <Text style={[styles.chartTitle, { color: colors.text }]}>Historial</Text>
            {[...datos].reverse().map((d, i) => (
              <View key={i} style={[styles.historialRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.historialFecha, { color: colors.textMuted }]}>{formatFechaCorta(d.fecha)}</Text>
                <Text style={[styles.historialPeso, { color: colors.text }]}>{parseFloat(fromDb(d.peso, unidad).toFixed(1))} {unidad}</Text>
                <Text style={[styles.historialReps, { color: colors.textMuted }]}>{d.reps} reps</Text>
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
    fontSize: 24,
    fontWeight: '800',
    fontStyle: 'italic',
    marginBottom: 20,
  },
  prCard: {
    borderRadius: 40,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
  },
  prLabel: {
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
    fontSize: 40,
    fontWeight: '800',
    fontFamily: 'Menlo',
  },
  prUnit: {
    fontSize: 14,
    marginTop: -4,
  },
  prSeparator: {
    fontSize: 28,
    marginHorizontal: 20,
  },
  chartCard: {
    borderRadius: 40,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
  },
  chartTitle: {
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
    borderRadius: 40,
    minHeight: 4,
  },
  barValue: {
    fontSize: 10,
    marginBottom: 4,
    fontFamily: 'Menlo',
  },
  barLabel: {
    fontSize: 10,
    marginTop: 6,
    fontFamily: 'Menlo',
  },
  emptyChart: {
    borderRadius: 40,
    padding: 32,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  historialCard: {
    borderRadius: 40,
    padding: 20,
    borderWidth: 1,
  },
  historialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  historialFecha: {
    fontSize: 14,
    flex: 1,
    fontFamily: 'Menlo',
  },
  historialPeso: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    fontFamily: 'Menlo',
  },
  historialReps: {
    fontSize: 14,
    flex: 1,
    textAlign: 'right',
    fontFamily: 'Menlo',
  },
});
