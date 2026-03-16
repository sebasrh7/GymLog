import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  Alert,
  Vibration,
  ScrollView,
  Share,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import KeepAwake from 'react-native-keep-awake';
import { rutinaService } from '../services/rutinaService';
import { sesionService } from '../services/sesionService';
import { sesionActivaService } from '../services/sesionActivaService';
import { useEjercicios } from '../hooks';
import { TimerModal } from '../components/TimerModal';
import { EjercicioPickerModal } from '../components/EjercicioPickerModal';
import { EjercicioWorkoutCard } from '../components/EjercicioWorkoutCard';
import { Ejercicio, EjercicioActivo, SerieLocal } from '../models';
import { COLORS } from '../utils/theme';
import { useColors } from '../utils/ThemeContext';
import { preferences } from '../utils/preferences';
import { useUnidad } from '../utils/UnidadContext';
import { fromDb, toDb, displayWeight, roundToPlate } from '../utils/conversion';

export const EntrenamientoScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const rutinaId: number | undefined = route.params?.rutinaId;

  const [sesionId, setSesionId] = useState<number | null>(null);
  const [rutinaNombre, setRutinaNombre] = useState('');
  const [ejerciciosActivos, setEjerciciosActivos] = useState<EjercicioActivo[]>([]);
  const [mostrarBiblioteca, setMostrarBiblioteca] = useState(false);
  const [mostrarTimer, setMostrarTimer] = useState(false);
  const [duracionTimer, setDuracionTimer] = useState(90);
  const [completado, setCompletado] = useState(false);
  const [resumen, setResumen] = useState<{
    totalSeries: number;
    volumenTotal: number;
    ejercicios: number;
    duracionSeg: number;
  } | null>(null);
  const [inicioTimestamp] = useState(Date.now());
  const [descansoDefault, setDescansoDefault] = useState(90);
  const [loading, setLoading] = useState(true);

  const { colors, isDark } = useColors();
  const { unidad } = useUnidad();
  const { ejercicios: biblioteca, recargar: recargarBiblioteca } = useEjercicios();

  // Keep screen awake
  useEffect(() => {
    KeepAwake.activate();
    preferences.getDescanso().then(setDescansoDefault).catch(() => {});
    return () => { KeepAwake.deactivate(); };
  }, []);

  // Ensure session exists
  const ensureSesion = useCallback(async (): Promise<number> => {
    if (sesionId) return sesionId;
    const id = await sesionService.crear(rutinaId);
    setSesionId(id);
    return id;
  }, [sesionId, rutinaId]);

  // Persist state for recovery
  const persistState = useCallback((activos: EjercicioActivo[], sid: number | null) => {
    if (!sid) return;
    sesionActivaService.guardar({
      sesionId: sid,
      rutinaId: rutinaId ?? null,
      ejerciciosActivos: activos.map(ea => ({
        ejercicioId: ea.ejercicio.id,
        ejercicioNombre: ea.ejercicio.nombre,
        grupoMuscular: ea.ejercicio.grupo_muscular,
        series: ea.series.map(s => ({
          peso: s.peso,
          reps: s.reps,
          completada: s.completada,
          nota: s.nota,
        })),
        descanso: ea.descanso,
        tipoSerie: ea.tipoSerie,
        grupoSerie: ea.grupoSerie,
        collapsed: ea.collapsed,
      })),
      timestamp: Date.now(),
    });
  }, [rutinaId]);

  // Initialize
  useEffect(() => {
    const init = async () => {
      // Try session recovery first
      const recovered = await sesionActivaService.cargar();
      if (recovered) {
        const matchesRoute = rutinaId
          ? recovered.rutinaId === rutinaId
          : recovered.rutinaId === null;

        if (matchesRoute) {
          setSesionId(recovered.sesionId);
          const activos: EjercicioActivo[] = await Promise.all(
            recovered.ejerciciosActivos.map(async (ea) => {
              const pr = await sesionService.getRecordPersonal(ea.ejercicioId);
              return {
                ejercicio: { id: ea.ejercicioId, nombre: ea.ejercicioNombre, grupo_muscular: ea.grupoMuscular },
                series: ea.series.map(s => ({ ...s })),
                descanso: ea.descanso,
                tipoSerie: ea.tipoSerie,
                grupoSerie: ea.grupoSerie,
                collapsed: ea.collapsed,
                recordPersonal: pr,
              };
            })
          );
          setEjerciciosActivos(activos);
          if (rutinaId) {
            const r = await rutinaService.getById(rutinaId);
            if (r) setRutinaNombre(r.nombre);
          }
          setLoading(false);
          return;
        }
      }

      // Fresh start
      if (rutinaId) {
        const r = await rutinaService.getById(rutinaId);
        if (!r || !r.ejercicios) {
          navigation.goBack();
          return;
        }
        setRutinaNombre(r.nombre);

        const activos: EjercicioActivo[] = await Promise.all(
          r.ejercicios.map(async (re) => {
            const pr = await sesionService.getRecordPersonal(re.ejercicio_id);
            const ultimas = await sesionService.getUltimasSeries(re.ejercicio_id);
            const series: SerieLocal[] = Array.from({ length: re.series }, (_, i) => ({
              peso: re.peso_objetivo > 0 ? displayWeight(re.peso_objetivo, unidad) : '0',
              reps: String(re.repeticiones),
              completada: false,
              pesoAnterior: ultimas[i]?.peso != null ? fromDb(ultimas[i].peso, unidad) : undefined,
              repsAnterior: ultimas[i]?.reps,
            }));
            return {
              ejercicio: { id: re.ejercicio_id, nombre: re.ejercicio_nombre, grupo_muscular: re.grupo_muscular },
              series,
              descanso: re.descanso,
              tipoSerie: re.tipo_serie ?? 'normal',
              grupoSerie: re.grupo_serie,
              collapsed: false,
              recordPersonal: pr,
            };
          })
        );

        const id = await sesionService.crear(rutinaId);
        setSesionId(id);
        setEjerciciosActivos(activos);
        persistState(activos, id);
      }
      // Free workout: start empty, session created lazily
      setLoading(false);
    };
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Complete series
  const handleCompletarSerie = useCallback(async (ejIndex: number, serieIndex: number) => {
    const ea = ejerciciosActivos[ejIndex];
    if (!ea) return;
    const serie = ea.series[serieIndex];
    if (!serie || serie.completada) return;

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

    const id = await ensureSesion();

    try {
      await sesionService.guardarSerie({
        sesion_id: id,
        ejercicio_id: ea.ejercicio.id,
        serie_numero: serieIndex + 1,
        peso: toDb(pesoNum, unidad),
        reps: repsNum,
        completado: true,
      });
    } catch {
      return;
    }

    Vibration.vibrate(100);

    const updatedActivos = [...ejerciciosActivos];
    const updatedSeries = [...updatedActivos[ejIndex].series];
    updatedSeries[serieIndex] = { ...updatedSeries[serieIndex], completada: true };
    updatedActivos[ejIndex] = { ...updatedActivos[ejIndex], series: updatedSeries };

    // Tipo serie logic
    let showTimer = true;
    let timerDur = ea.descanso;

    if (ea.tipoSerie === 'dropset') {
      showTimer = false;
      // Auto-reduce weight for next uncompleted series
      const nextIdx = updatedSeries.findIndex((s, i) => i > serieIndex && !s.completada);
      if (nextIdx !== -1) {
        const reducido = roundToPlate(pesoNum * 0.8, unidad);
        const newSeries = [...updatedActivos[ejIndex].series];
        newSeries[nextIdx] = { ...newSeries[nextIdx], peso: String(Math.max(0, reducido)) };
        updatedActivos[ejIndex] = { ...updatedActivos[ejIndex], series: newSeries };
      }
    } else if (ea.tipoSerie === 'rest_pause') {
      timerDur = ea.descanso > 0 ? ea.descanso : 15;
    } else if (ea.tipoSerie === 'superserie' && ea.grupoSerie != null) {
      const pairedIdx = updatedActivos.findIndex(
        (other, i) => i !== ejIndex
          && other.tipoSerie === 'superserie'
          && other.grupoSerie === ea.grupoSerie
      );
      if (pairedIdx !== -1) {
        const myCompleted = updatedActivos[ejIndex].series.filter(s => s.completada).length;
        const pairedCompleted = updatedActivos[pairedIdx].series.filter(s => s.completada).length;
        if (myCompleted > pairedCompleted) {
          showTimer = false;
        }
      }
    }

    // Auto-collapse if all series completed, expand next uncompleted
    const allDone = updatedActivos[ejIndex].series.every(s => s.completada);
    if (allDone) {
      updatedActivos[ejIndex] = { ...updatedActivos[ejIndex], collapsed: true };
      const nextUncompleted = updatedActivos.findIndex(
        (e, i) => i > ejIndex && e.series.some(s => !s.completada),
      );
      if (nextUncompleted !== -1 && updatedActivos[nextUncompleted].collapsed) {
        updatedActivos[nextUncompleted] = { ...updatedActivos[nextUncompleted], collapsed: false };
      }
    }

    setEjerciciosActivos(updatedActivos);
    persistState(updatedActivos, id);

    if (showTimer && timerDur > 0) {
      setDuracionTimer(timerDur);
      setMostrarTimer(true);
    }
  }, [ejerciciosActivos, ensureSesion, persistState, unidad]);

  // Undo completed serie
  const handleDescompletarSerie = useCallback(async (ejIndex: number, serieIndex: number) => {
    const ea = ejerciciosActivos[ejIndex];
    if (!ea) return;
    const serie = ea.series[serieIndex];
    if (!serie || !serie.completada) return;

    if (sesionId) {
      try {
        await sesionService.eliminarSerie(sesionId, ea.ejercicio.id, serieIndex + 1);
      } catch {
        return;
      }
    }

    const updatedActivos = [...ejerciciosActivos];
    const updatedSeries = [...updatedActivos[ejIndex].series];
    updatedSeries[serieIndex] = { ...updatedSeries[serieIndex], completada: false };
    updatedActivos[ejIndex] = { ...updatedActivos[ejIndex], series: updatedSeries, collapsed: false };

    setEjerciciosActivos(updatedActivos);
    persistState(updatedActivos, sesionId);
  }, [ejerciciosActivos, sesionId, persistState]);

  // Update serie field
  const handleUpdateSerie = useCallback((ejIndex: number, serieIndex: number, field: 'peso' | 'reps', value: string) => {
    setEjerciciosActivos(prev => {
      const updated = [...prev];
      const series = [...updated[ejIndex].series];
      series[serieIndex] = { ...series[serieIndex], [field]: value };
      updated[ejIndex] = { ...updated[ejIndex], series };
      return updated;
    });
  }, []);

  // Add serie
  const handleAgregarSerie = useCallback((ejIndex: number) => {
    setEjerciciosActivos(prev => {
      const updated = [...prev];
      const lastSerie = updated[ejIndex].series[updated[ejIndex].series.length - 1];
      updated[ejIndex] = {
        ...updated[ejIndex],
        series: [
          ...updated[ejIndex].series,
          { peso: lastSerie?.peso ?? '', reps: lastSerie?.reps ?? '', completada: false },
        ],
      };
      return updated;
    });
  }, []);

  // Remove serie
  const handleRemoveSerie = useCallback((ejIndex: number, serieIndex: number) => {
    setEjerciciosActivos(prev => {
      const updated = [...prev];
      const series = updated[ejIndex].series.filter((_, i) => i !== serieIndex);
      if (series.length === 0) return prev;
      updated[ejIndex] = { ...updated[ejIndex], series };
      return updated;
    });
  }, []);

  // Change descanso
  const handleDescansoChange = useCallback((ejIndex: number, seconds: number) => {
    setEjerciciosActivos(prev => {
      const updated = [...prev];
      updated[ejIndex] = { ...updated[ejIndex], descanso: seconds };
      return updated;
    });
  }, []);

  // Reorder
  const handleReorder = useCallback((ejIndex: number, direction: 'up' | 'down') => {
    setEjerciciosActivos(prev => {
      const targetIdx = direction === 'up' ? ejIndex - 1 : ejIndex + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const updated = [...prev];
      [updated[ejIndex], updated[targetIdx]] = [updated[targetIdx], updated[ejIndex]];
      return updated;
    });
  }, []);

  // Toggle collapse
  const handleToggleCollapse = useCallback((ejIndex: number) => {
    setEjerciciosActivos(prev => {
      const updated = [...prev];
      updated[ejIndex] = { ...updated[ejIndex], collapsed: !updated[ejIndex].collapsed };
      return updated;
    });
  }, []);

  // Remove exercise
  const handleRemoveEjercicio = useCallback((ejIndex: number) => {
    const ea = ejerciciosActivos[ejIndex];
    const hasDone = ea?.series.some(s => s.completada);
    const doRemove = () => {
      setEjerciciosActivos(prev => prev.filter((_, i) => i !== ejIndex));
    };
    if (hasDone) {
      Alert.alert(
        'Eliminar ejercicio',
        'Este ejercicio tiene series completadas. ¿Seguro que quieres eliminarlo?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Eliminar', style: 'destructive', onPress: doRemove },
        ],
      );
    } else {
      doRemove();
    }
  }, [ejerciciosActivos]);

  // Add exercise
  const handleAgregarEjercicio = useCallback(async (ejercicio: Ejercicio) => {
    if (ejerciciosActivos.some(ea => ea.ejercicio.id === ejercicio.id)) {
      setMostrarBiblioteca(false);
      return;
    }
    const pr = await sesionService.getRecordPersonal(ejercicio.id);
    const ultimas = await sesionService.getUltimasSeries(ejercicio.id);
    setEjerciciosActivos(prev => [
      ...prev,
      {
        ejercicio,
        series: [{
          peso: ultimas[0] ? displayWeight(ultimas[0].peso, unidad) : '',
          reps: ultimas[0] ? String(ultimas[0].reps) : '',
          completada: false,
          pesoAnterior: ultimas[0]?.peso != null ? fromDb(ultimas[0].peso, unidad) : undefined,
          repsAnterior: ultimas[0]?.reps,
        }],
        descanso: descansoDefault,
        tipoSerie: 'normal',
        grupoSerie: null,
        collapsed: false,
        recordPersonal: pr,
      },
    ]);
    setMostrarBiblioteca(false);
  }, [ejerciciosActivos, descansoDefault]);

  // Confirm exit
  const confirmarSalir = () => {
    const hasSeries = ejerciciosActivos.some(ea => ea.series.some(s => s.completada));
    if (!hasSeries && ejerciciosActivos.length === 0) {
      navigation.goBack();
      return;
    }
    Alert.alert(
      'Salir del entrenamiento',
      'Se guardarán las series completadas hasta ahora.',
      [
        { text: 'Continuar', style: 'cancel' },
        {
          text: 'Salir',
          style: 'destructive',
          onPress: async () => {
            await sesionActivaService.limpiar();
            navigation.goBack();
          },
        },
      ],
    );
  };

  // Finalize
  const handleFinalizar = useCallback(async () => {
    const total = ejerciciosActivos.reduce(
      (acc, ea) => acc + ea.series.filter(s => s.completada).length, 0,
    );
    if (total === 0) {
      Alert.alert('Sin series', 'Completa al menos una serie antes de finalizar.');
      return;
    }
    const duracionSeg = Math.floor((Date.now() - inicioTimestamp) / 1000);
    if (sesionId) {
      await sesionService.finalizarSesion(sesionId, duracionSeg);
      const r = await sesionService.getResumen(sesionId);
      setResumen(r);
    }
    await sesionActivaService.limpiar();
    setCompletado(true);
  }, [ejerciciosActivos, inicioTimestamp, sesionId]);

  const formatDuracion = (seg: number): string => {
    const m = Math.floor(seg / 60);
    const s = seg % 60;
    return m > 0 ? `${m} min ${s > 0 ? `${s}s` : ''}` : `${s}s`;
  };

  // Progress
  const totalSeries = ejerciciosActivos.reduce((acc, ea) => acc + ea.series.length, 0);
  const totalCompletadas = ejerciciosActivos.reduce(
    (acc, ea) => acc + ea.series.filter(s => s.completada).length, 0,
  );
  const progreso = totalSeries > 0 ? totalCompletadas / totalSeries : 0;

  // ── Completion screen ──
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
                  {Math.round(fromDb(resumen.volumenTotal, unidad)).toLocaleString()} {unidad}
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
            {ejerciciosActivos.length} ejercicios · {totalCompletadas} series
          </Text>
        )}

        <View style={styles.completadoActions}>
          <TouchableOpacity
            style={styles.btnVolver}
            onPress={() => navigation.goBack()}
            activeOpacity={0.85}
          >
            <Text style={styles.btnVolverText}>Volver al inicio</Text>
          </TouchableOpacity>
          {resumen && (
            <TouchableOpacity
              style={[styles.btnCompartir, { borderColor: colors.border }]}
              onPress={() => {
                const msg = `💪 Entrenamiento completado!\n\n⏱ ${formatDuracion(resumen.duracionSeg)}\n🏋️ ${Math.round(fromDb(resumen.volumenTotal, unidad)).toLocaleString()} ${unidad} volumen\n📋 ${resumen.totalSeries} series · ${resumen.ejercicios} ejercicios\n\n— GymLog`;
                Share.share({ message: msg }).catch(() => {});
              }}
              activeOpacity={0.85}
            >
              <Ionicons name="share-outline" size={18} color={colors.text} />
              <Text style={[styles.btnCompartirText, { color: colors.text }]}>Compartir</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // ── Loading ──
  if (loading) {
    return <View style={[styles.container, { backgroundColor: colors.bg }]} />;
  }

  // ── Main workout screen ──
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={confirmarSalir}
          style={[styles.btnClose, { backgroundColor: colors.bgCard }]}
          activeOpacity={0.85}
        >
          <Ionicons name="close" size={20} color={colors.textMuted} />
        </TouchableOpacity>
        <Text style={[styles.topTitle, { color: colors.text }]} numberOfLines={1}>
          {rutinaNombre || 'Entrenamiento libre'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Progress bar */}
      {totalSeries > 0 && (
        <View style={[styles.progressBg, { backgroundColor: colors.border }]}>
          <View style={[styles.progressFill, { width: `${progreso * 100}%` }]} />
        </View>
      )}

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Exercise cards */}
        {ejerciciosActivos.map((ea, ejIndex) => {
          const ejCompleted = ea.series.every(s => s.completada);
          const firstUncompleted = ejerciciosActivos.findIndex(
            e => e.series.some(s => !s.completada),
          );
          return (
            <EjercicioWorkoutCard
              key={ea.ejercicio.id}
              ea={ea}
              ejIndex={ejIndex}
              isFirst={ejIndex === 0}
              isLast={ejIndex === ejerciciosActivos.length - 1}
              isActive={ejIndex === firstUncompleted}
              isCompleted={ejCompleted}
              onCompletarSerie={handleCompletarSerie}
              onUpdateSerie={handleUpdateSerie}
              onAgregarSerie={handleAgregarSerie}
              onRemoveSerie={handleRemoveSerie}
              onDescansoChange={handleDescansoChange}
              onReorder={handleReorder}
              onToggleCollapse={handleToggleCollapse}
              onRemoveEjercicio={handleRemoveEjercicio}
              onDescompletarSerie={handleDescompletarSerie}
            />
          );
        })}

        {/* Empty state */}
        {ejerciciosActivos.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="barbell-outline" size={48} color={colors.textDim} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              Agrega ejercicios para comenzar tu entrenamiento
            </Text>
          </View>
        )}

        {/* Finish button */}
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

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* FAB */}
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
        onClose={() => setMostrarBiblioteca(false)}
        onEjercicioCreado={recargarBiblioteca}
      />

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
  container: { flex: 1 },
  centerContent: { justifyContent: 'center', alignItems: 'center' },

  // Top bar
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
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },

  // Progress
  progressBg: {
    height: 3,
    marginHorizontal: 20,
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.accent,
  },

  // Scroll
  scrollContent: { flex: 1 },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },

  // Empty
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
  completadoActions: {
    alignItems: 'center',
    gap: 16,
  },
  btnCompartir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 40,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderWidth: 1,
  },
  btnCompartirText: {
    fontSize: 15,
    fontWeight: '600',
  },
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
    borderRadius: 20,
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
