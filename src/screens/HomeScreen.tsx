import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  StatusBar,
  SafeAreaView,
  RefreshControl,
  ScrollView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useRutinas } from '../hooks';
import { rutinaService } from '../services/rutinaService';
import { RutinaCard } from '../components/RutinaCard';
import { COLORS, globalStyles } from '../utils/theme';
import { useColors } from '../utils/ThemeContext';
import { useToast } from '../components/Toast';
import { getDatabase } from '../database/database';

interface HomeStats {
  rachaActual: number;
  totalVolumen: number;
  ultimoTiempo: number; // minutes
}

const formatVolumen = (v: number): string => {
  if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
  return String(Math.round(v));
};

export const HomeScreen = () => {
  const navigation = useNavigation<any>();
  const { rutinas, loading, recargar } = useRutinas();
  const { colors, isDark } = useColors();
  const toast = useToast();
  const [stats, setStats] = useState<HomeStats>({
    rachaActual: 0,
    totalVolumen: 0,
    ultimoTiempo: 0,
  });

  useFocusEffect(
    useCallback(() => {
      recargar();
      const cargarStats = async () => {
        try {
          const db = await getDatabase();

          // Total volume
          const [volRes] = await db.executeSql(
            'SELECT COALESCE(SUM(sr.peso * sr.reps), 0) as vol FROM series_realizadas sr WHERE sr.completado = 1',
          );
          const totalVolumen = volRes.rows.item(0).vol ?? 0;

          // Last session duration
          const [lastRes] = await db.executeSql(
            'SELECT duracion_seg FROM sesiones ORDER BY fecha DESC LIMIT 1',
          );
          const ultimoTiempo =
            lastRes.rows.length > 0
              ? Math.round((lastRes.rows.item(0).duracion_seg ?? 0) / 60)
              : 0;

          // Streak
          const [diasRes] = await db.executeSql(
            "SELECT DISTINCT date(fecha) as dia FROM sesiones ORDER BY dia DESC",
          );
          let rachaActual = 0;
          let racha = 0;
          let prevDate: Date | null = null;

          for (let i = 0; i < diasRes.rows.length; i++) {
            const d = new Date(diasRes.rows.item(i).dia + 'T12:00:00');
            if (prevDate === null) {
              const hoy = new Date();
              hoy.setHours(12, 0, 0, 0);
              const diff = Math.round((hoy.getTime() - d.getTime()) / 86400000);
              if (diff <= 1) {
                racha = 1;
              } else {
                racha = 1;
                rachaActual = 0;
              }
              prevDate = d;
              continue;
            }
            const diffDays = Math.round((prevDate.getTime() - d.getTime()) / 86400000);
            if (diffDays === 1) {
              racha++;
            } else {
              if (rachaActual === 0 && i <= 1) {
                rachaActual = racha;
              }
              racha = 1;
            }
            prevDate = d;
          }
          if (rachaActual === 0 && diasRes.rows.length > 0) {
            const hoy = new Date();
            hoy.setHours(12, 0, 0, 0);
            const firstDay = new Date(diasRes.rows.item(0).dia + 'T12:00:00');
            const diff = Math.round((hoy.getTime() - firstDay.getTime()) / 86400000);
            if (diff <= 1) {
              rachaActual = racha;
            }
          }

          setStats({ rachaActual, totalVolumen, ultimoTiempo });
        } catch {
          // silent
        }
      };
      cargarStats();
    }, [recargar]),
  );

  const confirmarEliminar = (id: number, nombre: string) => {
    Alert.alert(
      'Eliminar rutina',
      `¿Seguro que deseas eliminar "${nombre}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await rutinaService.eliminar(id);
            recargar();
            toast.show('Rutina eliminada');
          },
        },
      ],
    );
  };

  const NAV_ITEMS = [
    { icon: 'calendar-outline', screen: 'Calendario' },
    { icon: 'settings-outline', screen: 'Ajustes' },
  ];

  const QUICK_ACTIONS = [
    { icon: 'copy-outline', label: 'Plantillas', screen: 'Plantillas' },
    { icon: 'calculator-outline', label: 'Calculadora', screen: 'Calculadora' },
    { icon: 'flash-outline', label: 'Libre', screen: 'EntrenamientoLibre' },
    { icon: 'body-outline', label: 'Medidas', screen: 'Medidas' },
    { icon: 'stats-chart-outline', label: 'Stats', screen: 'ResumenEstadisticas' },
    { icon: 'time-outline', label: 'Historial', screen: 'Historial' },
  ];

  return (
    <SafeAreaView style={[globalStyles.container, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.bg} />

      {loading ? (
        <View style={globalStyles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={rutinas}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={false} onRefresh={recargar} tintColor={colors.accent} />
          }
          ListHeaderComponent={
            <>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.logoRow}>
                  <View style={styles.logoIcon}>
                    <Ionicons name="barbell" size={20} color={COLORS.accent} />
                  </View>
                  <Text style={[styles.logoText, { color: colors.text }]}>GYMLOG</Text>
                </View>
                <View style={styles.navRow}>
                  {NAV_ITEMS.map(n => (
                    <TouchableOpacity
                      key={n.screen}
                      activeOpacity={0.85}
                      style={[styles.navBtn, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
                      onPress={() => navigation.navigate(n.screen)}
                    >
                      <Ionicons name={n.icon} size={22} color={colors.textMuted} />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Bento Stats Grid */}
              <View style={styles.bentoRow}>
                {/* Large streak card */}
                <View
                  style={[styles.bentoLarge, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
                >
                  <View style={styles.bentoIconWrap}>
                    <Ionicons name="flame" size={22} color={COLORS.accent} />
                  </View>
                  <Text style={[styles.bentoLabel, { color: colors.textMuted }]}>RACHA</Text>
                  <View style={styles.bentoValueRow}>
                    <Text style={[styles.bentoValueBig, { color: colors.text }]}>
                      {stats.rachaActual}
                    </Text>
                    <Text style={[styles.bentoUnit, { color: colors.textMuted }]}> días</Text>
                  </View>
                </View>

                {/* Right column: volume + time */}
                <View style={styles.bentoRightCol}>
                  <View
                    style={[styles.bentoSmall, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
                  >
                    <View style={styles.bentoSmallHeader}>
                      <Text style={[styles.bentoSmallLabel, { color: colors.textMuted }]}>VOLUMEN</Text>
                      <Ionicons name="trending-up" size={16} color={colors.textDim} />
                    </View>
                    <Text style={[styles.bentoSmallValue, { color: COLORS.accent }]}>
                      {formatVolumen(stats.totalVolumen)}
                    </Text>
                  </View>

                  <View
                    style={[styles.bentoSmall, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
                  >
                    <View style={styles.bentoSmallHeader}>
                      <Text style={[styles.bentoSmallLabel, { color: colors.textMuted }]}>TIEMPO</Text>
                      <Ionicons name="time-outline" size={16} color={colors.textDim} />
                    </View>
                    <Text style={[styles.bentoSmallValue, { color: colors.text }]}>
                      {stats.ultimoTiempo > 0 ? `${stats.ultimoTiempo}m` : '--'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Quick Actions — horizontal scroll */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.quickScroll}
                style={styles.quickScrollContainer}
              >
                {QUICK_ACTIONS.map(a => (
                  <TouchableOpacity
                    key={a.screen}
                    activeOpacity={0.85}
                    style={[styles.quickPill, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
                    onPress={() => navigation.navigate(a.screen)}
                  >
                    <Ionicons name={a.icon} size={16} color={colors.textMuted} />
                    <Text style={[styles.quickPillText, { color: colors.textMuted }]}>{a.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Section title */}
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Tu entrenamiento</Text>
            </>
          }
          ListEmptyComponent={
            <View style={[styles.emptyCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="add" size={32} color={colors.textDim} />
              </View>
              <Text style={[styles.emptyText, { color: colors.text }]}>Sin rutinas activas</Text>
              <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>
                Diseña tu victoria. Empieza creando tu primera rutina de entrenamiento
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <RutinaCard
              rutina={item}
              onPress={() =>
                navigation.navigate('DetalleRutina', { rutinaId: item.id })
              }
              onIniciar={() =>
                navigation.navigate('Entrenamiento', { rutinaId: item.id })
              }
              onEliminar={() => confirmarEliminar(item.id, item.nombre)}
            />
          )}
        />
      )}

      <TouchableOpacity
        style={[styles.fab, { shadowColor: colors.accent }]}
        onPress={() => navigation.navigate('CrearRutina')}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={24} color="#FFF" style={{ marginRight: 8 }} />
        <Text style={styles.fabText}>Nueva rutina</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 4,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,0,0,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 24,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 1,
  },
  navRow: {
    flexDirection: 'row',
    gap: 8,
  },
  navBtn: {
    borderRadius: 14,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },

  // Bento Stats
  bentoRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  bentoLarge: {
    flex: 1,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    justifyContent: 'space-between',
    minHeight: 160,
  },
  bentoIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,0,0,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bentoLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 12,
  },
  bentoValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  bentoValueBig: {
    fontSize: 40,
    fontWeight: '800',
    fontFamily: 'Menlo',
  },
  bentoUnit: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bentoRightCol: {
    flex: 1,
    gap: 10,
  },
  bentoSmall: {
    flex: 1,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    justifyContent: 'space-between',
  },
  bentoSmallHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bentoSmallLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  bentoSmallValue: {
    fontSize: 24,
    fontWeight: '800',
    fontFamily: 'Menlo',
  },

  // Quick Actions
  quickScrollContainer: {
    marginBottom: 24,
  },
  quickScroll: {
    paddingHorizontal: 4,
    gap: 8,
  },
  quickPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 40,
    borderWidth: 1,
  },
  quickPillText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Section
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    paddingHorizontal: 4,
    marginBottom: 14,
  },

  // Empty
  emptyCard: {
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '800',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 32,
    left: 24,
    right: 24,
    backgroundColor: COLORS.accent,
    borderRadius: 40,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: COLORS.accent,
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
  },
  fabText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 0.3,
  },
});
