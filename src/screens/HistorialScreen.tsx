import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { sesionService } from '../services/sesionService';
import { Sesion } from '../models';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS, globalStyles } from '../utils/theme';
import { useColors } from '../utils/ThemeContext';
import { useUnidad } from '../utils/UnidadContext';
import { fromDb } from '../utils/conversion';
import { formatHora } from '../utils/formatters';

const formatDuracion = (seg?: number): string => {
  if (!seg) return '—';
  const m = Math.floor(seg / 60);
  if (m >= 60) {
    const h = Math.floor(m / 60);
    return `${h}h${m % 60}m`;
  }
  return `${m}m`;
};

const formatVolumen = (v: number): string => {
  if (!v) return '0';
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
  return String(Math.round(v));
};

const getFechaKey = (fecha: string): string => {
  const d = new Date(fecha);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const formatFechaHeader = (fecha: string): string => {
  const d = new Date(fecha);
  const hoy = new Date();
  const ayer = new Date();
  ayer.setDate(ayer.getDate() - 1);

  if (getFechaKey(fecha) === getFechaKey(hoy.toISOString())) return 'Hoy';
  if (getFechaKey(fecha) === getFechaKey(ayer.toISOString())) return 'Ayer';

  return `${DIAS_SEMANA[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()]}`;
};

type ListItem =
  | { type: 'header'; fecha: string; key: string }
  | { type: 'sesion'; data: Sesion; key: string };

export const HistorialScreen = () => {
  const { colors } = useColors();
  const { unidad } = useUnidad();
  const [sesiones, setSesiones] = useState<Sesion[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const cargar = async () => {
        setLoading(true);
        const data = await sesionService.getHistorial();
        setSesiones(data);
        setLoading(false);
      };
      cargar();
    }, []),
  );

  const recargar = useCallback(async () => {
    const data = await sesionService.getHistorial();
    setSesiones(data);
  }, []);

  const confirmarEliminar = (id: number) => {
    Alert.alert('Eliminar sesión', '¿Eliminar este registro de entrenamiento?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await sesionService.eliminar(id);
          setSesiones(prev => prev.filter(s => s.id !== id));
        },
      },
    ]);
  };

  // Build list with date headers
  const listItems: ListItem[] = [];
  let lastDateKey = '';
  for (const s of sesiones) {
    const dateKey = getFechaKey(s.fecha);
    if (dateKey !== lastDateKey) {
      listItems.push({ type: 'header', fecha: s.fecha, key: `hdr-${dateKey}` });
      lastDateKey = dateKey;
    }
    listItems.push({ type: 'sesion', data: s, key: `ses-${s.id}` });
  }

  if (loading) {
    return (
      <View style={[globalStyles.center, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={[globalStyles.container, { backgroundColor: colors.bg }]}>
      <FlatList
        data={listItems}
        keyExtractor={item => item.key}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={recargar} tintColor={colors.accent} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="clipboard-outline" size={52} color={colors.textDim} />
            <Text style={[styles.emptyText, { color: colors.text }]}>Sin entrenamientos aún</Text>
            <Text style={[styles.emptySub, { color: colors.textMuted }]}>Completa tu primera sesión</Text>
          </View>
        }
        renderItem={({ item }) => {
          if (item.type === 'header') {
            return (
              <View style={styles.dateHeader}>
                <View style={[styles.dateLine, { backgroundColor: colors.border }]} />
                <Text style={[styles.dateText, { color: colors.text }]}>
                  {formatFechaHeader(item.fecha)}
                </Text>
                <View style={[styles.dateLine, { backgroundColor: colors.border }]} />
              </View>
            );
          }

          const s = item.data;
          return (
            <TouchableOpacity
              style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
              onLongPress={() => confirmarEliminar(s.id)}
              activeOpacity={0.85}
            >
              {/* Red left accent strip */}
              <View style={styles.accentStrip}>
                <Text style={styles.accentText}>
                  {formatVolumen(fromDb(s.volumen_total ?? 0, unidad))}
                </Text>
                <Text style={styles.accentUnit}>{unidad}</Text>
              </View>

              {/* Card content */}
              <View style={styles.cardContent}>
                {/* Title row */}
                <View style={styles.titleRow}>
                  <Text style={[styles.rutinaNombre, { color: colors.text }]} numberOfLines={1}>
                    {s.rutina_nombre ?? 'Entrenamiento libre'}
                  </Text>
                  <Text style={[styles.hora, { color: colors.textDim }]}>
                    {formatHora(s.fecha)}
                  </Text>
                </View>

                {/* Stats row */}
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Ionicons name="layers-outline" size={14} color={colors.accent} />
                    <Text style={[styles.statText, { color: colors.textMuted }]}>
                      {s.total_series ?? 0}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.textDim }]}>series</Text>
                  </View>
                  <View style={[styles.statDot, { backgroundColor: colors.border }]} />
                  <View style={styles.statItem}>
                    <Ionicons name="barbell-outline" size={14} color={colors.accent} />
                    <Text style={[styles.statText, { color: colors.textMuted }]}>
                      {Math.round(fromDb(s.volumen_total ?? 0, unidad)).toLocaleString()}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.textDim }]}>{unidad}</Text>
                  </View>
                  <View style={[styles.statDot, { backgroundColor: colors.border }]} />
                  <View style={styles.statItem}>
                    <Ionicons name="time-outline" size={14} color={colors.accent} />
                    <Text style={[styles.statText, { color: colors.textMuted }]}>
                      {formatDuracion(s.duracion_seg)}
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  list: { padding: 24, paddingBottom: 40 },

  // Date separator
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 12,
    gap: 12,
  },
  dateLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '800',
    fontStyle: 'italic',
  },

  // Card
  card: {
    borderRadius: 20,
    marginBottom: 8,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
  },
  accentStrip: {
    width: 48,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  accentText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
    fontFamily: 'Menlo',
  },
  accentUnit: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 1,
  },
  cardContent: {
    flex: 1,
    padding: 14,
    paddingLeft: 16,
    gap: 10,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rutinaNombre: {
    fontSize: 16,
    fontWeight: '800',
    flex: 1,
    marginRight: 8,
  },
  hora: {
    fontSize: 12,
    fontFamily: 'Menlo',
  },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Menlo',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  statDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },

  // Empty
  empty: { alignItems: 'center', marginTop: 80 },
  emptyText: {
    fontSize: 20,
    fontWeight: '800',
    fontStyle: 'italic',
    marginTop: 16,
  },
  emptySub: { fontSize: 14, marginTop: 6 },
});
