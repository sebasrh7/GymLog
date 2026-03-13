import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  StatusBar,
  SafeAreaView,
  Alert,
  Vibration,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import KeepAwake from 'react-native-keep-awake';
import { sesionService } from '../services/sesionService';
import { useEjercicios } from '../hooks';
import { TimerModal } from '../components/TimerModal';
import { EjercicioPickerModal } from '../components/EjercicioPickerModal';
import { Ejercicio } from '../models';
import { COLORS } from '../utils/theme';
import { useColors } from '../utils/ThemeContext';
import { capitalize } from '../utils/formatters';

interface SerieLocal {
  peso: string;
  reps: string;
  completada: boolean;
}

interface EjercicioActivo {
  ejercicio: Ejercicio;
  series: SerieLocal[];
}

export const EntrenamientoLibreScreen = () => {
  const navigation = useNavigation<any>();

  const [sesionId, setSesionId] = useState<number | null>(null);
  const [ejerciciosActivos, setEjerciciosActivos] = useState<EjercicioActivo[]>([]);
  const [mostrarBiblioteca, setMostrarBiblioteca] = useState(false);
  const [inicioTimestamp] = useState(Date.now());
  const [completado, setCompletado] = useState(false);
  const [resumen, setResumen] = useState<{
    totalSeries: number;
    volumenTotal: number;
    ejercicios: number;
    duracionSeg: number;
  } | null>(null);
  const [mostrarTimer, setMostrarTimer] = useState(false);
  const [duracionTimer, setDuracionTimer] = useState(90);

  const { colors, isDark } = useColors();
  const { ejercicios: biblioteca, recargar: recargarBiblioteca } = useEjercicios();

  // Mantener pantalla encendida durante entrenamiento
  useEffect(() => {
    KeepAwake.activate();
    return () => {
      KeepAwake.deactivate();
    };
  }, []);

  const crearSesionSiNecesario = useCallback(async (): Promise<number> => {
    if (sesionId) return sesionId;
    const id = await sesionService.crear();
    setSesionId(id);
    return id;
  }, [sesionId]);

  const handleAgregarEjercicio = useCallback(
    async (ejercicio: Ejercicio) => {
      // Evitar duplicados
      if (ejerciciosActivos.some(ea => ea.ejercicio.id === ejercicio.id)) {
        setMostrarBiblioteca(false);

        return;
      }

      await crearSesionSiNecesario();

      setEjerciciosActivos(prev => [
        ...prev,
        {
          ejercicio,
          series: [{ peso: '', reps: '', completada: false }],
        },
      ]);
      setMostrarBiblioteca(false);
    },
    [ejerciciosActivos, crearSesionSiNecesario],
  );

  const handleAgregarSerie = useCallback((ejIndex: number) => {
    setEjerciciosActivos(prev => {
      const updated = [...prev];
      const lastSerie = updated[ejIndex].series[updated[ejIndex].series.length - 1];
      updated[ejIndex] = {
        ...updated[ejIndex],
        series: [
          ...updated[ejIndex].series,
          { peso: lastSerie.peso, reps: lastSerie.reps, completada: false },
        ],
      };
      return updated;
    });
  }, []);

  const handleUpdateSerie = useCallback(
    (ejIndex: number, serieIndex: number, field: 'peso' | 'reps', value: string) => {
      setEjerciciosActivos(prev => {
        const updated = [...prev];
        const series = [...updated[ejIndex].series];
        series[serieIndex] = { ...series[serieIndex], [field]: value };
        updated[ejIndex] = { ...updated[ejIndex], series };
        return updated;
      });
    },
    [],
  );

  const handleCompletarSerie = useCallback(
    async (ejIndex: number, serieIndex: number) => {
      const ea = ejerciciosActivos[ejIndex];
      const serie = ea.series[serieIndex];

      if (serie.completada) return;

      const pesoNum = parseFloat(serie.peso);
      const repsNum = parseInt(serie.reps, 10);

      if (isNaN(pesoNum) || pesoNum < 0) {
        Alert.alert('Peso inválido', 'Ingresa un peso válido (0 o mayor).');
        return;
      }
      if (isNaN(repsNum) || repsNum < 1) {
        Alert.alert('Repeticiones inválidas', 'Ingresa al menos 1 repetición.');
        return;
      }

      const id = await crearSesionSiNecesario();

      try {
        await sesionService.guardarSerie({
          sesion_id: id,
          ejercicio_id: ea.ejercicio.id,
          serie_numero: serieIndex + 1,
          peso: pesoNum,
          reps: repsNum,
          completado: true,
        });
      } catch {
        return;
      }

      Vibration.vibrate(100);

      setEjerciciosActivos(prev => {
        const updated = [...prev];
        const series = [...updated[ejIndex].series];
        series[serieIndex] = { ...series[serieIndex], completada: true };
        updated[ejIndex] = { ...updated[ejIndex], series };
        return updated;
      });

      // Mostrar timer de descanso
      setDuracionTimer(90);
      setMostrarTimer(true);
    },
    [ejerciciosActivos, crearSesionSiNecesario],
  );

  const confirmarSalir = () => {
    if (ejerciciosActivos.length === 0) {
      navigation.goBack();
      return;
    }
    Alert.alert(
      'Salir del entrenamiento',
      '¿Seguro? Se guardarán las series completadas hasta ahora.',
      [
        { text: 'Continuar', style: 'cancel' },
        { text: 'Salir', style: 'destructive', onPress: () => navigation.goBack() },
      ],
    );
  };

  const handleFinalizar = () => {
    const totalCompletadas = ejerciciosActivos.reduce(
      (acc, ea) => acc + ea.series.filter(s => s.completada).length,
      0,
    );
    if (totalCompletadas === 0) {
      Alert.alert('Sin series', 'Completa al menos una serie antes de finalizar.');
      return;
    }
    Alert.alert(
      'Finalizar entrenamiento',
      '¿Deseas finalizar este entrenamiento libre?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Finalizar',
          onPress: () => setCompletado(true),
        },
      ],
    );
  };

  // Cargar resumen al completar
  useEffect(() => {
    if (completado && sesionId) {
      const duracionSeg = Math.floor((Date.now() - inicioTimestamp) / 1000);
      sesionService.finalizarSesion(sesionId, duracionSeg).then(() => {
        sesionService.getResumen(sesionId).then(r => setResumen(r));
      });
    }
  }, [completado, sesionId, inicioTimestamp]);

  const formatDuracion = (seg: number): string => {
    const m = Math.floor(seg / 60);
    const s = seg % 60;
    return m > 0 ? `${m} min ${s > 0 ? `${s}s` : ''}` : `${s}s`;
  };


  const totalSeriesCompletadas = ejerciciosActivos.reduce(
    (acc, ea) => acc + ea.series.filter(s => s.completada).length,
    0,
  );

  // Pantalla de fin
  if (completado) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent, { backgroundColor: colors.bg }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <Ionicons name="trophy" size={72} color={colors.warning} style={{ marginBottom: 20 }} />
        <Text style={[styles.completadoTitle, { color: colors.text }]}>
          ¡Entrenamiento completado!
        </Text>

        {resumen ? (
          <View style={styles.resumenContainer}>
            <View style={styles.resumenRow}>
              <View style={[styles.resumenItem, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
                <Ionicons name="time-outline" size={22} color={colors.accent} />
                <Text style={[styles.resumenValor, { color: colors.text }]}>
                  {formatDuracion(resumen.duracionSeg)}
                </Text>
                <Text style={[styles.resumenLabel, { color: colors.textMuted }]}>Duración</Text>
              </View>
              <View style={[styles.resumenItem, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
                <Ionicons name="barbell-outline" size={22} color={colors.accent} />
                <Text style={[styles.resumenValor, { color: colors.text }]}>
                  {resumen.volumenTotal.toLocaleString()} kg
                </Text>
                <Text style={[styles.resumenLabel, { color: colors.textMuted }]}>Volumen</Text>
              </View>
            </View>
            <View style={styles.resumenRow}>
              <View style={[styles.resumenItem, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
                <Ionicons name="list-outline" size={22} color={colors.accent} />
                <Text style={[styles.resumenValor, { color: colors.text }]}>
                  {resumen.totalSeries}
                </Text>
                <Text style={[styles.resumenLabel, { color: colors.textMuted }]}>Series</Text>
              </View>
              <View style={[styles.resumenItem, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
                <Ionicons name="fitness-outline" size={22} color={colors.accent} />
                <Text style={[styles.resumenValor, { color: colors.text }]}>
                  {resumen.ejercicios}
                </Text>
                <Text style={[styles.resumenLabel, { color: colors.textMuted }]}>Ejercicios</Text>
              </View>
            </View>
          </View>
        ) : (
          <Text style={[styles.completadoSub, { color: colors.textMuted }]}>
            {ejerciciosActivos.length} ejercicios · {totalSeriesCompletadas} series
          </Text>
        )}

        <TouchableOpacity
          style={styles.btnVolver}
          onPress={() => navigation.goBack()}
          activeOpacity={0.85}
        >
          <Text style={styles.btnVolverText}>Volver al inicio</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={confirmarSalir} style={[styles.btnClose, { backgroundColor: colors.bgCard }]} activeOpacity={0.85}>
          <Ionicons name="close" size={20} color={colors.textMuted} />
        </TouchableOpacity>
        <Text style={[styles.topTitle, { color: colors.text }]}>Entrenamiento libre</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Lista de ejercicios activos */}
        {ejerciciosActivos.map((ea, ejIndex) => (
          <View key={ea.ejercicio.id} style={[styles.ejercicioCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            {/* Encabezado del ejercicio */}
            <View style={styles.ejercicioHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.grupoTag, { color: colors.accent }]}>
                  {capitalize(ea.ejercicio.grupo_muscular)}
                </Text>
                <Text style={[styles.ejercicioNombre, { color: colors.text }]}>
                  {ea.ejercicio.nombre}
                </Text>
              </View>
            </View>

            {/* Encabezado de columnas */}
            <View style={styles.serieHeaderRow}>
              <Text style={[styles.serieHeaderText, { width: 40, color: colors.textDim }]}>Serie</Text>
              <Text style={[styles.serieHeaderText, { flex: 1, color: colors.textDim }]}>Peso (kg)</Text>
              <Text style={[styles.serieHeaderText, { flex: 1, color: colors.textDim }]}>Reps</Text>
              <View style={{ width: 44 }} />
            </View>

            {/* Series */}
            {ea.series.map((serie, serieIndex) => (
              <View
                key={serieIndex}
                style={[
                  styles.serieRow,
                  serie.completada && styles.serieRowDone,
                ]}
              >
                <Text style={[styles.serieNumero, { color: colors.text }]}>
                  {serieIndex + 1}
                </Text>
                <TextInput
                  style={[
                    styles.serieInput,
                    { backgroundColor: colors.bgInput, color: colors.text },
                    serie.completada && { backgroundColor: colors.border },
                  ]}
                  value={serie.peso}
                  onChangeText={v => handleUpdateSerie(ejIndex, serieIndex, 'peso', v)}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.textDim}
                  editable={!serie.completada}
                  selectTextOnFocus
                />
                <TextInput
                  style={[
                    styles.serieInput,
                    { backgroundColor: colors.bgInput, color: colors.text },
                    serie.completada && { backgroundColor: colors.border },
                  ]}
                  value={serie.reps}
                  onChangeText={v => handleUpdateSerie(ejIndex, serieIndex, 'reps', v)}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.textDim}
                  editable={!serie.completada}
                  selectTextOnFocus
                />
                <TouchableOpacity
                  style={[
                    styles.btnCheck,
                    { backgroundColor: colors.bgInput },
                    serie.completada && styles.btnCheckDone,
                  ]}
                  onPress={() => handleCompletarSerie(ejIndex, serieIndex)}
                  disabled={serie.completada}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name="checkmark"
                    size={18}
                    color={serie.completada ? '#FFF' : COLORS.textMuted}
                  />
                </TouchableOpacity>
              </View>
            ))}

            {/* Agregar serie */}
            <TouchableOpacity
              style={styles.btnAgregarSerie}
              onPress={() => handleAgregarSerie(ejIndex)}
              activeOpacity={0.85}
            >
              <Ionicons name="add" size={16} color={colors.accent} />
              <Text style={[styles.btnAgregarSerieText, { color: colors.accent }]}>Serie</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* Mensaje vacío */}
        {ejerciciosActivos.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="barbell-outline" size={48} color={colors.textDim} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              Agrega ejercicios para comenzar tu entrenamiento libre
            </Text>
          </View>
        )}

        {/* Botón finalizar */}
        {ejerciciosActivos.length > 0 && (
          <TouchableOpacity
            style={styles.btnFinalizar}
            onPress={handleFinalizar}
            activeOpacity={0.85}
          >
            <Ionicons name="flag" size={18} color="#FFF" />
            <Text style={styles.btnFinalizarText}>Finalizar entrenamiento</Text>
          </TouchableOpacity>
        )}

        {/* Espaciado para FAB */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* FAB Agregar ejercicio */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setMostrarBiblioteca(true)}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={24} color="#FFF" />
        <Text style={styles.fabText}>Ejercicio</Text>
      </TouchableOpacity>

      <EjercicioPickerModal
        visible={mostrarBiblioteca}
        ejercicios={biblioteca}
        seleccionadoIds={ejerciciosActivos.map(ea => ea.ejercicio.id)}
        onSelect={handleAgregarEjercicio}
        onClose={() => {
          setMostrarBiblioteca(false);
        }}
        onEjercicioCreado={recargarBiblioteca}
      />

      {/* Timer Modal */}
      <TimerModal
        visible={mostrarTimer}
        duracion={duracionTimer}
        onFinish={() => setMostrarTimer(false)}
        onSkip={() => setMostrarTimer(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  centerContent: { justifyContent: 'center', alignItems: 'center' },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },
  btnClose: {
    width: 40,
    height: 40,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topTitle: {
    fontSize: 17,
    fontWeight: '800',
    fontStyle: 'italic',
  },
  scrollContent: { flex: 1 },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },

  // Ejercicio card
  ejercicioCard: {
    borderRadius: 40,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  ejercicioHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  grupoTag: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  ejercicioNombre: {
    fontSize: 18,
    fontWeight: '800',
    fontStyle: 'italic',
  },

  // Series header
  serieHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  serieHeaderText: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    textTransform: 'uppercase',
  },

  // Serie row
  serieRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  serieRowDone: {
    opacity: 0.6,
  },
  serieNumero: {
    width: 32,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Menlo',
  },
  serieInput: {
    flex: 1,
    borderRadius: 40,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Menlo',
    textAlign: 'center',
  },
  serieInputDone: {},
  btnCheck: {
    width: 36,
    height: 36,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnCheckDone: {
    backgroundColor: COLORS.success,
  },

  // Agregar serie
  btnAgregarSerie: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 4,
    marginTop: 4,
  },
  btnAgregarSerieText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 16,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 22,
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    backgroundColor: COLORS.accent,
    borderRadius: 40,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 6,
    shadowColor: COLORS.accent,
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  fabText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },

  // Finalizar
  btnFinalizar: {
    backgroundColor: COLORS.accent,
    borderRadius: 40,
    paddingVertical: 20,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    shadowColor: COLORS.accent,
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  btnFinalizarText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '800',
    fontStyle: 'italic',
  },

  // Completado / Resumen
  completadoTitle: {
    fontSize: 26,
    fontWeight: '800',
    fontStyle: 'italic',
    marginBottom: 10,
  },
  completadoSub: {
    fontSize: 16,
    marginBottom: 40,
  },
  btnVolver: {
    backgroundColor: COLORS.accent,
    borderRadius: 40,
    paddingVertical: 18,
    paddingHorizontal: 48,
    shadowColor: COLORS.accent,
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  btnVolverText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  resumenContainer: {
    width: '100%',
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  resumenRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  resumenItem: {
    flex: 1,
    borderRadius: 40,
    padding: 16,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
  },
  resumenValor: {
    fontSize: 18,
    fontWeight: '800',
    fontFamily: 'Menlo',
  },
  resumenLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
});
