import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Share,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import RNFS from 'react-native-fs';
import { useFocusEffect } from '@react-navigation/native';
import { backupService } from '../services/backupService';
import { getDatabase } from '../database/database';
import { COLORS, globalStyles } from '../utils/theme';
import { useColors, ThemeMode } from '../utils/ThemeContext';

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: string }[] = [
  { value: 'system', label: 'Sistema', icon: 'phone-portrait-outline' },
  { value: 'light', label: 'Claro', icon: 'sunny-outline' },
  { value: 'dark', label: 'Oscuro', icon: 'moon-outline' },
];

interface AthleteStats {
  totalSesiones: number;
  totalVolumen: number;
  rachaActual: number;
  mejorRacha: number;
}

export const AjustesScreen = () => {
  const { colors, mode, setMode, isDark } = useColors();
  const [stats, setStats] = useState<AthleteStats>({
    totalSesiones: 0,
    totalVolumen: 0,
    rachaActual: 0,
    mejorRacha: 0,
  });

  useFocusEffect(
    useCallback(() => {
      const cargar = async () => {
        try {
          const db = await getDatabase();

          const [countRes] = await db.executeSql(
            'SELECT COUNT(*) as total FROM sesiones',
          );
          const totalSesiones = countRes.rows.item(0).total ?? 0;

          const [volRes] = await db.executeSql(
            'SELECT COALESCE(SUM(sr.peso * sr.reps), 0) as vol FROM series_realizadas sr WHERE sr.completado = 1',
          );
          const totalVolumen = volRes.rows.item(0).vol ?? 0;

          // Streak calculation (consecutive days with sessions)
          const [diasRes] = await db.executeSql(
            "SELECT DISTINCT date(fecha) as dia FROM sesiones ORDER BY dia DESC",
          );
          let rachaActual = 0;
          let mejorRacha = 0;
          let racha = 0;
          let prevDate: Date | null = null;

          for (let i = 0; i < diasRes.rows.length; i++) {
            const d = new Date(diasRes.rows.item(i).dia + 'T12:00:00');
            if (prevDate === null) {
              // Check if first date is today or yesterday
              const hoy = new Date();
              hoy.setHours(12, 0, 0, 0);
              const diff = Math.round((hoy.getTime() - d.getTime()) / 86400000);
              if (diff <= 1) {
                racha = 1;
              } else {
                racha = 1; // Start counting but won't be "current"
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
              mejorRacha = Math.max(mejorRacha, racha);
              racha = 1;
            }
            prevDate = d;
          }
          mejorRacha = Math.max(mejorRacha, racha);
          if (rachaActual === 0 && diasRes.rows.length > 0) {
            const hoy = new Date();
            hoy.setHours(12, 0, 0, 0);
            const firstDay = new Date(diasRes.rows.item(0).dia + 'T12:00:00');
            const diff = Math.round((hoy.getTime() - firstDay.getTime()) / 86400000);
            if (diff <= 1) {
              rachaActual = racha;
            }
          }

          setStats({ totalSesiones, totalVolumen, rachaActual, mejorRacha });
        } catch {
          // silent
        }
      };
      cargar();
    }, []),
  );

  const handleExportar = async () => {
    try {
      const path = await backupService.exportar();
      await Share.share({
        title: 'GymLog Backup',
        message: `Backup de GymLog creado. Archivo: ${path}`,
        url: `file://${path}`,
      });
    } catch {
      Alert.alert('Error', 'No se pudo crear el backup.');
    }
  };

  const handleExportarCSV = async () => {
    try {
      const path = await backupService.exportarCSV();
      await Share.share({
        title: 'GymLog CSV Export',
        message: `Historial de GymLog exportado a CSV. Archivo: ${path}`,
        url: `file://${path}`,
      });
    } catch {
      Alert.alert('Error', 'No se pudo exportar a CSV.');
    }
  };

  const handleImportar = async () => {
    try {
      // Scan for backup files in Documents directory
      const files = await RNFS.readDir(RNFS.DocumentDirectoryPath);
      const backups = files
        .filter(f => f.name.startsWith('gymlog_backup_') && f.name.endsWith('.json'))
        .sort((a, b) => (b.mtime?.getTime() ?? 0) - (a.mtime?.getTime() ?? 0));

      if (backups.length === 0) {
        Alert.alert(
          'Sin backups',
          'No se encontraron archivos de backup. Exporta primero un backup o copia un archivo gymlog_backup_*.json al directorio de la app.',
        );
        return;
      }

      // Show list of available backups
      const buttons = backups.slice(0, 5).map(backup => {
        const date = new Date(
          parseInt(backup.name.replace('gymlog_backup_', '').replace('.json', ''), 10),
        );
        const label = isNaN(date.getTime())
          ? backup.name
          : `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
        return {
          text: label,
          onPress: () => {
            Alert.alert(
              'Restaurar backup',
              'Esto reemplazará TODOS tus datos actuales. ¿Continuar?',
              [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'Restaurar',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await backupService.importar(backup.path);
                      Alert.alert('Backup restaurado', 'Tus datos han sido restaurados correctamente. Reinicia la app para ver los cambios.');
                    } catch {
                      Alert.alert('Error', 'No se pudo restaurar el backup. El archivo puede estar corrupto.');
                    }
                  },
                },
              ],
            );
          },
        };
      });

      buttons.push({ text: 'Cancelar', onPress: () => {} });

      Alert.alert(
        'Seleccionar backup',
        `${backups.length} backup${backups.length > 1 ? 's' : ''} encontrado${backups.length > 1 ? 's' : ''}`,
        buttons,
      );
    } catch {
      Alert.alert('Error', 'No se pudo buscar archivos de backup.');
    }
  };

  const handleBorrarDatos = () => {
    Alert.alert(
      'Borrar todos los datos',
      '¿Estás seguro? Esta acción eliminará todas tus rutinas, ejercicios e historial. No se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar todo',
          style: 'destructive',
          onPress: async () => {
            try {
              const dbPath = `${RNFS.DocumentDirectoryPath}/../databases/gymlog.db`;
              const exists = await RNFS.exists(dbPath);
              if (exists) {
                await RNFS.unlink(dbPath);
              }
              Alert.alert(
                'Datos eliminados',
                'Reinicia la app para completar el proceso.',
              );
            } catch {
              Alert.alert('Error', 'No se pudieron borrar los datos.');
            }
          },
        },
      ],
    );
  };

  const formatVolumen = (v: number): string => {
    if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
    if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
    return String(v);
  };

  type MenuItem = {
    icon: string;
    title: string;
    subtitle: string;
    onPress: () => void;
    destructive?: boolean;
  };

  const dataItems: MenuItem[] = [
    { icon: 'download-outline', title: 'Exportar backup', subtitle: 'Guarda una copia de tus datos', onPress: handleExportar },
    { icon: 'document-text-outline', title: 'Exportar a CSV', subtitle: 'Historial en formato CSV', onPress: handleExportarCSV },
    { icon: 'push-outline', title: 'Importar backup', subtitle: 'Restaura desde un archivo', onPress: handleImportar },
    { icon: 'trash-outline', title: 'Borrar todos los datos', subtitle: 'Elimina rutinas, ejercicios e historial', onPress: handleBorrarDatos, destructive: true },
  ];

  const aboutItems: MenuItem[] = [
    { icon: 'barbell', title: 'GymLog', subtitle: 'Versión 1.0.0', onPress: () => {} },
    { icon: 'heart-outline', title: 'Hecho con React Native', subtitle: 'Open source', onPress: () => {} },
  ];

  const renderMenuItem = (item: MenuItem, index: number, isLast: boolean) => (
    <View key={index}>
      <TouchableOpacity
        style={styles.menuItem}
        onPress={item.onPress}
        activeOpacity={0.85}
      >
        <View style={[styles.menuIcon, { backgroundColor: colors.bg }]}>
          <Ionicons
            name={item.icon}
            size={20}
            color={item.destructive ? COLORS.accent : colors.accent}
          />
        </View>
        <View style={styles.menuContent}>
          <Text style={[styles.menuTitle, item.destructive ? { color: COLORS.accent } : { color: colors.text }]}>
            {item.title}
          </Text>
          <Text style={[styles.menuSubtitle, { color: colors.textMuted }]}>
            {item.subtitle}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={COLORS.accent} />
      </TouchableOpacity>
      {!isLast && <View style={[styles.menuSep, { backgroundColor: colors.border }]} />}
    </View>
  );

  return (
    <SafeAreaView style={[globalStyles.container, { backgroundColor: colors.bg }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.bg}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Athlete profile header */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <View style={[styles.avatarGlow, { shadowColor: COLORS.accent }]}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={36} color={colors.textMuted} />
              </View>
            </View>
          </View>
          <Text style={[styles.profileName, { color: colors.text }]}>Atleta</Text>
          <Text style={[styles.profileSub, { color: colors.textMuted }]}>
            GymLog · Entrenamiento personal
          </Text>
        </View>

        {/* Streak / Stats row */}
        <View style={styles.streakRow}>
          <View style={[styles.streakCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <Ionicons name="flame" size={22} color={COLORS.accent} />
            <Text style={[styles.streakValue, { color: colors.text }]}>
              {stats.rachaActual}
            </Text>
            <Text style={[styles.streakLabel, { color: colors.textMuted }]}>Racha actual</Text>
          </View>
          <View style={[styles.streakCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <Ionicons name="trophy" size={22} color={COLORS.accent} />
            <Text style={[styles.streakValue, { color: colors.text }]}>
              {stats.mejorRacha}
            </Text>
            <Text style={[styles.streakLabel, { color: colors.textMuted }]}>Mejor racha</Text>
          </View>
          <View style={[styles.streakCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <Ionicons name="barbell" size={22} color={COLORS.accent} />
            <Text style={[styles.streakValue, { color: colors.text }]}>
              {stats.totalSesiones}
            </Text>
            <Text style={[styles.streakLabel, { color: colors.textMuted }]}>Sesiones</Text>
          </View>
        </View>

        {/* Total volume banner */}
        <View style={[styles.volumenBanner, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <Ionicons name="trending-up" size={20} color={COLORS.accent} />
          <Text style={[styles.volumenText, { color: colors.text }]}>
            Volumen total:{' '}
            <Text style={styles.volumenNum}>{formatVolumen(stats.totalVolumen)} kg</Text>
          </Text>
        </View>

        {/* Apariencia */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Apariencia</Text>
        <View style={[styles.menuCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <Text style={[styles.themeLabel, { color: colors.textMuted }]}>Tema</Text>
          <View style={styles.chipRow}>
            {THEME_OPTIONS.map((opt) => {
              const selected = mode === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: selected ? COLORS.accent : colors.bgInput,
                      borderColor: selected ? COLORS.accent : colors.border,
                    },
                  ]}
                  onPress={() => setMode(opt.value)}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name={opt.icon}
                    size={16}
                    color={selected ? '#FFF' : colors.textMuted}
                  />
                  <Text style={[styles.chipText, { color: selected ? '#FFF' : colors.textMuted }]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Datos */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Datos</Text>
        <View style={[styles.menuCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          {dataItems.map((item, i) => renderMenuItem(item, i, i === dataItems.length - 1))}
        </View>

        {/* Acerca de */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Acerca de</Text>
        <View style={[styles.menuCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          {aboutItems.map((item, i) => renderMenuItem(item, i, i === aboutItems.length - 1))}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },

  // Profile
  profileSection: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 24,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatarGlow: {
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.accent,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '800',
    fontStyle: 'italic',
  },
  profileSub: {
    fontSize: 13,
    marginTop: 4,
  },

  // Streak row
  streakRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  streakCard: {
    flex: 1,
    borderRadius: 20,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
  },
  streakValue: {
    fontSize: 22,
    fontWeight: '800',
    fontFamily: 'Menlo',
  },
  streakLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Volume banner
  volumenBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 20,
    padding: 16,
    marginBottom: 28,
    borderWidth: 1,
  },
  volumenText: {
    fontSize: 14,
    fontWeight: '600',
  },
  volumenNum: {
    fontWeight: '800',
    fontFamily: 'Menlo',
    color: COLORS.accent,
  },

  // Section
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    fontStyle: 'italic',
    marginBottom: 12,
  },

  // Menu cards
  menuCard: {
    borderRadius: 20,
    padding: 4,
    borderWidth: 1,
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  menuSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  menuSep: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 60,
  },

  // Theme
  themeLabel: {
    fontSize: 13,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 8,
    paddingBottom: 12,
  },
  chip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
  },

  bottomSpacer: {
    height: 20,
  },
});
