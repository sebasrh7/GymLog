import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getDatabase } from '../database/database';
import { COLORS, globalStyles } from '../utils/theme';
import { useColors } from '../utils/ThemeContext';
import { capitalize } from '../utils/formatters';

type Periodo = 'semanal' | 'mensual';

interface Stats {
  entrenamientos: number;
  volumen: number;
  series: number;
  duracionTotal: number;
}

interface GrupoMuscular {
  grupo_muscular: string;
  total: number;
}

const formatDuracion = (seg: number): string => {
  if (seg < 60) return `${seg}s`;
  const min = Math.floor(seg / 60);
  const h = Math.floor(min / 60);
  if (h > 0) {
    const mRest = min % 60;
    return `${h}h ${mRest}m`;
  }
  return `${min}m`;
};

export const ResumenEstadisticasScreen = () => {
  const { colors } = useColors();
  const [periodo, setPeriodo] = useState<Periodo>('semanal');
  const [stats, setStats] = useState<Stats | null>(null);
  const [grupos, setGrupos] = useState<GrupoMuscular[]>([]);
  const [loading, setLoading] = useState(true);

  const fechaFiltro = periodo === 'semanal'
    ? "date('now', '-7 days')"
    : "date('now', '-30 days')";

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      const db = await getDatabase();

      // Total entrenamientos
      const [countResult] = await db.executeSql(
        `SELECT COUNT(*) as total FROM sesiones WHERE fecha >= ${fechaFiltro}`,
      );
      const entrenamientos = countResult.rows.item(0).total ?? 0;

      // Volume and series
      const [volResult] = await db.executeSql(
        `SELECT COALESCE(SUM(sr.peso * sr.reps), 0) as volumen,
                COUNT(*) as series
         FROM series_realizadas sr
         JOIN sesiones s ON s.id = sr.sesion_id
         WHERE s.fecha >= ${fechaFiltro} AND sr.completado = 1`,
      );
      const volRow = volResult.rows.item(0);
      const volumen = volRow.volumen ?? 0;
      const series = volRow.series ?? 0;

      // Total duration
      const [durResult] = await db.executeSql(
        `SELECT COALESCE(SUM(duracion_seg), 0) as duracion
         FROM sesiones WHERE fecha >= ${fechaFiltro}`,
      );
      const duracionTotal = durResult.rows.item(0).duracion ?? 0;

      setStats({ entrenamientos, volumen, series, duracionTotal });

      // Muscle group breakdown
      const [grupoResult] = await db.executeSql(
        `SELECT LOWER(e.grupo_muscular) as grupo_muscular, COUNT(*) as total
         FROM series_realizadas sr
         JOIN sesiones s ON s.id = sr.sesion_id
         JOIN ejercicios e ON e.id = sr.ejercicio_id
         WHERE s.fecha >= ${fechaFiltro} AND sr.completado = 1
         GROUP BY LOWER(e.grupo_muscular)
         ORDER BY total DESC`,
      );
      const gruposArr: GrupoMuscular[] = [];
      for (let i = 0; i < grupoResult.rows.length; i++) {
        gruposArr.push(grupoResult.rows.item(i));
      }
      setGrupos(gruposArr);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    } finally {
      setLoading(false);
    }
  }, [fechaFiltro]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const duracionPromedio =
    stats && stats.entrenamientos > 0
      ? Math.round(stats.duracionTotal / stats.entrenamientos)
      : 0;

  const maxGrupo = grupos.length > 0 ? grupos[0].total : 1;

  if (loading) {
    return (
      <View style={[globalStyles.center, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  return (
    <View style={[globalStyles.container, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Period pill toggle */}
        <View style={[styles.pillContainer, { backgroundColor: colors.bgCard }]}>
          <TouchableOpacity
            style={[
              styles.pillSegment,
              periodo === 'semanal' && styles.pillActive,
            ]}
            onPress={() => setPeriodo('semanal')}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.pillText,
                periodo === 'semanal' && styles.pillTextActive,
              ]}
            >
              Semanal
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.pillSegment,
              periodo === 'mensual' && styles.pillActive,
            ]}
            onPress={() => setPeriodo('mensual')}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.pillText,
                periodo === 'mensual' && styles.pillTextActive,
              ]}
            >
              Mensual
            </Text>
          </TouchableOpacity>
        </View>

        {/* Bento Grid – 2×2 stat cards */}
        <View style={styles.bentoGrid}>
          <View style={[styles.bentoCard, { backgroundColor: colors.bgCard }]}>
            <View style={styles.bentoIconWrap}>
              <Ionicons name="calendar" size={28} color={colors.accent} />
            </View>
            <Text style={[styles.bentoValor, { color: colors.text }]}>
              {stats?.entrenamientos ?? 0}
            </Text>
            <Text style={[styles.bentoLabel, { color: colors.textMuted }]}>
              Entrenamientos
            </Text>
          </View>
          <View style={[styles.bentoCard, { backgroundColor: colors.bgCard }]}>
            <View style={styles.bentoIconWrap}>
              <Ionicons name="barbell" size={28} color={colors.accent} />
            </View>
            <Text style={[styles.bentoValor, { color: colors.text }]}>
              {(stats?.volumen ?? 0).toLocaleString()} kg
            </Text>
            <Text style={[styles.bentoLabel, { color: colors.textMuted }]}>
              Volumen
            </Text>
          </View>
          <View style={[styles.bentoCard, { backgroundColor: colors.bgCard }]}>
            <View style={styles.bentoIconWrap}>
              <Ionicons name="list" size={28} color={colors.accent} />
            </View>
            <Text style={[styles.bentoValor, { color: colors.text }]}>
              {stats?.series ?? 0}
            </Text>
            <Text style={[styles.bentoLabel, { color: colors.textMuted }]}>
              Series
            </Text>
          </View>
          <View style={[styles.bentoCard, { backgroundColor: colors.bgCard }]}>
            <View style={styles.bentoIconWrap}>
              <Ionicons name="time" size={28} color={colors.accent} />
            </View>
            <Text style={[styles.bentoValor, { color: colors.text }]}>
              {formatDuracion(stats?.duracionTotal ?? 0)}
            </Text>
            <Text style={[styles.bentoLabel, { color: colors.textMuted }]}>
              Duración
            </Text>
          </View>
        </View>

        {/* Average duration */}
        <View style={[styles.promedioCard, { backgroundColor: colors.bgCard }]}>
          <Ionicons name="speedometer-outline" size={20} color={colors.accent} />
          <Text style={[styles.promedioText, { color: colors.text }]}>
            Duracion promedio:{' '}
            <Text style={{ fontWeight: '800', fontFamily: 'Menlo' }}>{formatDuracion(duracionPromedio)}</Text>
          </Text>
        </View>

        {/* Muscle group breakdown */}
        <View style={[styles.gruposCard, { backgroundColor: colors.bgCard }]}>
          <Text style={[styles.gruposTitle, { color: colors.text }]}>
            Frecuencia por grupo muscular
          </Text>
          {grupos.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              Sin datos para este periodo.
            </Text>
          ) : (
            grupos.map((g, i) => {
              const barWidth = (g.total / maxGrupo) * 100;
              return (
                <View key={i} style={styles.grupoRow}>
                  <Text style={[styles.grupoNombre, { color: colors.text }]}>
                    {capitalize(g.grupo_muscular)}
                  </Text>
                  <View style={styles.grupoBarContainer}>
                    <View
                      style={[
                        styles.grupoBar,
                        { width: `${barWidth}%`, backgroundColor: COLORS.accent },
                      ]}
                    />
                  </View>
                  <Text style={[styles.grupoTotal, { color: colors.textMuted }]}>
                    {g.total}
                  </Text>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  scroll: {
    padding: 24,
    paddingBottom: 40,
  },
  pillContainer: {
    flexDirection: 'row',
    borderRadius: 40,
    padding: 4,
    marginBottom: 20,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pillSegment: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 40,
    backgroundColor: 'transparent',
  },
  pillActive: {
    backgroundColor: COLORS.accent,
  },
  pillText: {
    color: COLORS.textMuted,
    fontWeight: '700',
    fontSize: 13,
  },
  pillTextActive: {
    color: '#FFF',
  },
  bentoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  bentoCard: {
    width: '47%',
    borderRadius: 28,
    padding: 20,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  bentoIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,0,0,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  bentoValor: {
    fontSize: 22,
    fontWeight: '800',
    fontFamily: 'Menlo',
  },
  bentoLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  promedioCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 40,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  promedioText: {
    fontSize: 14,
    fontWeight: '600',
  },
  gruposCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 40,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  gruposTitle: {
    fontSize: 16,
    fontWeight: '800',
    fontStyle: 'italic',
    marginBottom: 16,
  },
  grupoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  grupoNombre: {
    width: 90,
    fontSize: 13,
    fontWeight: '600',
  },
  grupoBarContainer: {
    flex: 1,
    height: 14,
    backgroundColor: COLORS.bgInput,
    borderRadius: 40,
    marginHorizontal: 10,
    overflow: 'hidden',
  },
  grupoBar: {
    height: '100%',
    borderRadius: 40,
  },
  grupoTotal: {
    width: 30,
    textAlign: 'right',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Menlo',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 16,
  },
});
