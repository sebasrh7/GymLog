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
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import KeepAwake from 'react-native-keep-awake';
import { rutinaService } from '../services/rutinaService';
import { sesionService } from '../services/sesionService';
import { sesionActivaService } from '../services/sesionActivaService';
import { useSesion, useTimer } from '../hooks';
import { TimerModal } from '../components/TimerModal';
import { Rutina, RutinaEjercicio, TipoSerie, TIPO_SERIE_LABELS } from '../models';
import { COLORS } from '../utils/theme';
import { useColors } from '../utils/ThemeContext';
import { capitalize } from '../utils/formatters';

export const EntrenamientoScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { rutinaId } = route.params;

  const [rutina, setRutina] = useState<Rutina | null>(null);
  const [ejercicioIndex, setEjercicioIndex] = useState(0);
  const [serieActual, setSerieActual] = useState(1);
  const [peso, setPeso] = useState('');
  const [reps, setReps] = useState('');
  const [mostrarTimer, setMostrarTimer] = useState(false);
  const [duracionTimer, setDuracionTimer] = useState(90);
  const [completado, setCompletado] = useState(false);
  const [seriesCompletadas, setSeriesCompletadas] = useState<Set<string>>(new Set());
  const [recordPersonal, setRecordPersonal] = useState<{ peso: number; reps: number } | null>(null);
  const [inicioTimestamp] = useState(Date.now());
  const [resumen, setResumen] = useState<{ totalSeries: number; volumenTotal: number; ejercicios: number; duracionSeg: number } | null>(null);
  const [notaSerie, setNotaSerie] = useState('');

  const { colors, isDark } = useColors();
  const { sesionId, iniciarSesion, completarSerie } = useSesion();
  const { detener: detenerTimer } = useTimer(90);

  // Mantener pantalla encendida durante entrenamiento
  useEffect(() => {
    KeepAwake.activate();
    return () => {
      KeepAwake.deactivate();
    };
  }, []);

  // Limpiar timer al salir de la pantalla
  useEffect(() => {
    return () => {
      detenerTimer();
      setMostrarTimer(false);
    };
  }, [detenerTimer]);

  useEffect(() => {
    const init = async () => {
      const r = await rutinaService.getById(rutinaId);
      setRutina(r);

      // Intentar recuperar sesión interrumpida
      const guardada = await sesionActivaService.cargar();
      if (guardada && guardada.rutinaId === rutinaId) {
        setEjercicioIndex(guardada.ejercicioIndex);
        setSerieActual(guardada.serieActual);
        setPeso(guardada.peso);
        setReps(guardada.reps);
        setSeriesCompletadas(new Set(guardada.seriesCompletadas));
        // Restaurar sesionId directamente
        await iniciarSesion(rutinaId);
        const ejId = r?.ejercicios?.[guardada.ejercicioIndex]?.ejercicio_id;
        if (ejId) {
          const pr = await sesionService.getRecordPersonal(ejId);
          setRecordPersonal(pr);
        }
        return;
      }

      if (r?.ejercicios?.[0]) {
        setPeso(String(r.ejercicios[0].peso_objetivo));
        setReps(String(r.ejercicios[0].repeticiones));
        const pr = await sesionService.getRecordPersonal(r.ejercicios[0].ejercicio_id);
        setRecordPersonal(pr);
      }
      await iniciarSesion(rutinaId);
    };
    init();
  }, []);

  const ejercicioActual: RutinaEjercicio | undefined =
    rutina?.ejercicios?.[ejercicioIndex];

  const totalEjercicios = rutina?.ejercicios?.length ?? 0;
  const claveCompletada = `${ejercicioIndex}-${serieActual}`;
  const yaCompletada = seriesCompletadas.has(claveCompletada);

  const handleCompletar = useCallback(async () => {
    if (!ejercicioActual || yaCompletada) return;

    // Validar inputs numéricos
    const pesoNum = parseFloat(peso);
    const repsNum = parseInt(reps, 10);

    if (isNaN(pesoNum) || pesoNum < 0) {
      Alert.alert('Peso inválido', 'Ingresa un peso válido (0 o mayor).');
      return;
    }
    if (isNaN(repsNum) || repsNum < 1) {
      Alert.alert('Repeticiones inválidas', 'Ingresa al menos 1 repetición.');
      return;
    }

    // Guardar serie
    try {
      await completarSerie(
        ejercicioActual.ejercicio_id,
        serieActual,
        pesoNum,
        repsNum,
      );
    } catch {
      return; // El error ya se muestra en el servicio
    }

    // Feedback háptico al completar serie
    Vibration.vibrate(100);

    const nuevasCompletadas = new Set(seriesCompletadas);
    nuevasCompletadas.add(claveCompletada);
    setSeriesCompletadas(nuevasCompletadas);

    const tipoSerie: TipoSerie = ejercicioActual.tipo_serie ?? 'normal';
    const descanso = ejercicioActual.descanso;

    // ¿Quedan más series?
    let nextEjIdx = ejercicioIndex;
    let nextSerie = serieActual;
    let nextPeso = peso;
    let nextReps = reps;
    let showTimer = true;
    let timerDuration = descanso;

    if (serieActual < ejercicioActual.series) {
      nextSerie = serieActual + 1;
      setSerieActual(nextSerie);

      // Dropset: reducir peso 20%, sin descanso entre series
      if (tipoSerie === 'dropset') {
        const reducido = Math.round((parseFloat(peso) * 0.8) / 2.5) * 2.5;
        nextPeso = String(Math.max(0, reducido));
        setPeso(nextPeso);
        showTimer = false;
      } else if (tipoSerie === 'rest_pause') {
        timerDuration = descanso > 0 ? descanso : 15;
      }

      if (showTimer && timerDuration > 0) {
        setDuracionTimer(timerDuration);
        setMostrarTimer(true);
      }
    } else {
      // Siguiente ejercicio
      const next = ejercicioIndex + 1;
      if (next < totalEjercicios) {
        const nextEj = rutina!.ejercicios![next];

        // Superserie: si el siguiente ejercicio tiene el mismo grupo_serie, sin descanso
        const mismoGrupoSuper =
          tipoSerie === 'superserie' &&
          nextEj.tipo_serie === 'superserie' &&
          ejercicioActual.grupo_serie != null &&
          nextEj.grupo_serie === ejercicioActual.grupo_serie;

        nextEjIdx = next;
        nextSerie = 1;
        nextPeso = String(nextEj.peso_objetivo);
        nextReps = String(nextEj.repeticiones);
        setEjercicioIndex(next);
        setSerieActual(1);
        setPeso(nextPeso);
        setReps(nextReps);
        sesionService.getRecordPersonal(nextEj.ejercicio_id).then(setRecordPersonal).catch(() => {});

        if (mismoGrupoSuper) {
          // No rest between superset exercises
          showTimer = false;
        } else {
          timerDuration = descanso;
        }

        if (showTimer && timerDuration > 0) {
          setDuracionTimer(timerDuration);
          setMostrarTimer(true);
        }
      } else {
        // Fin del entrenamiento
        setCompletado(true);
        await sesionActivaService.limpiar();
        return;
      }
    }

    // Persistir progreso para recuperación
    sesionActivaService.guardar({
      sesionId: sesionId ?? 0,
      rutinaId,
      ejercicioIndex: nextEjIdx,
      serieActual: nextSerie,
      seriesCompletadas: Array.from(nuevasCompletadas),
      peso: nextPeso,
      reps: nextReps,
      timestamp: Date.now(),
    });
  }, [
    ejercicioActual, serieActual, peso, reps,
    ejercicioIndex, rutina, totalEjercicios,
    seriesCompletadas, claveCompletada, yaCompletada,
    sesionId, completarSerie, rutinaId,
  ]);

  const confirmarSalir = () => {
    Alert.alert(
      'Salir del entrenamiento',
      '¿Seguro? Se guardarán las series completadas hasta ahora.',
      [
        { text: 'Continuar', style: 'cancel' },
        { text: 'Salir', style: 'destructive', onPress: async () => { await sesionActivaService.limpiar(); navigation.goBack(); } },
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

  // Pantalla de fin
  if (completado) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent, { backgroundColor: colors.bg }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <Ionicons name="trophy" size={72} color={colors.warning} style={{ marginBottom: 20 }} />
        <Text style={[styles.completadoTitle, { color: colors.text }]}>¡Entrenamiento completado!</Text>

        {resumen ? (
          <View style={styles.resumenContainer}>
            <View style={styles.resumenRow}>
              <View style={styles.resumenItem}>
                <Ionicons name="time-outline" size={22} color={colors.accent} />
                <Text style={[styles.resumenValor, { color: colors.text }]}>
                  {formatDuracion(resumen.duracionSeg)}
                </Text>
                <Text style={styles.resumenLabel}>Duración</Text>
              </View>
              <View style={styles.resumenItem}>
                <Ionicons name="barbell-outline" size={22} color={colors.accent} />
                <Text style={[styles.resumenValor, { color: colors.text }]}>
                  {resumen.volumenTotal.toLocaleString()} kg
                </Text>
                <Text style={styles.resumenLabel}>Volumen</Text>
              </View>
            </View>
            <View style={styles.resumenRow}>
              <View style={styles.resumenItem}>
                <Ionicons name="list-outline" size={22} color={colors.accent} />
                <Text style={[styles.resumenValor, { color: colors.text }]}>
                  {resumen.totalSeries}
                </Text>
                <Text style={styles.resumenLabel}>Series</Text>
              </View>
              <View style={styles.resumenItem}>
                <Ionicons name="fitness-outline" size={22} color={colors.accent} />
                <Text style={[styles.resumenValor, { color: colors.text }]}>
                  {resumen.ejercicios}
                </Text>
                <Text style={styles.resumenLabel}>Ejercicios</Text>
              </View>
            </View>
          </View>
        ) : (
          <Text style={styles.completadoSub}>
            {totalEjercicios} ejercicios · {seriesCompletadas.size} series
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

  if (!ejercicioActual) {
    return <View style={[styles.container, { backgroundColor: colors.bg }]} />;
  }

  const progresoPct =
    ((ejercicioIndex * (ejercicioActual?.series ?? 1) + serieActual - 1) /
      (totalEjercicios * (ejercicioActual?.series ?? 1))) *
    100;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={confirmarSalir} style={styles.btnClose} activeOpacity={0.85}>
          <Ionicons name="close" size={20} color={COLORS.textMuted} />
        </TouchableOpacity>
        <Text style={styles.topProgreso}>
          {ejercicioIndex + 1} / {totalEjercicios}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Barra progreso global */}
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${Math.min(progresoPct, 100)}%` }]} />
      </View>

      {/* Contenido principal */}
      <View style={styles.content}>
        {/* Grupo muscular + nombre */}
        <Text style={styles.grupoTag}>
          {capitalize(ejercicioActual.grupo_muscular)}
        </Text>
        <Text style={styles.ejercicioNombre}>{ejercicioActual.ejercicio_nombre}</Text>

        {/* Badge tipo de serie */}
        {ejercicioActual.tipo_serie && ejercicioActual.tipo_serie !== 'normal' && (
          <View style={styles.tipoBadge}>
            <Text style={styles.tipoBadgeText}>
              {TIPO_SERIE_LABELS[ejercicioActual.tipo_serie]}
            </Text>
          </View>
        )}

        {/* Récord personal */}
        {recordPersonal && (
          <View style={styles.prBadge}>
            <Text style={styles.prText}>
              PR: {recordPersonal.peso} kg × {recordPersonal.reps} reps
            </Text>
          </View>
        )}

        {/* Número de serie */}
        <View style={styles.serieContainer}>
          <Text style={styles.serieLabel}>Serie</Text>
          <Text style={styles.serieNumero}>
            {serieActual}
            <Text style={styles.serieDe}> / {ejercicioActual.series}</Text>
          </Text>
        </View>

        {/* Dots de series */}
        <View style={styles.dots}>
          {Array.from({ length: ejercicioActual.series }, (_, i) => {
            const done = seriesCompletadas.has(`${ejercicioIndex}-${i + 1}`);
            const current = i + 1 === serieActual;
            return (
              <View
                key={i}
                style={[
                  styles.dot,
                  done && styles.dotDone,
                  current && !done && styles.dotCurrent,
                ]}
              />
            );
          })}
        </View>

        {/* Inputs peso / reps */}
        <View style={styles.inputsRow}>
          <View style={styles.inputBlock}>
            <Text style={styles.inputLabel}>Peso (kg)</Text>
            <View style={styles.inputWrapper}>
              <TouchableOpacity
                onPress={() => setPeso(p => String(Math.max(0, (parseFloat(p) || 0) - 2.5)))}
                style={styles.inputBtn}
                activeOpacity={0.85}
              >
                <Text style={styles.inputBtnText}>−</Text>
              </TouchableOpacity>
              <TextInput
                style={styles.inputField}
                value={peso}
                onChangeText={setPeso}
                keyboardType="numeric"
                selectTextOnFocus
              />
              <TouchableOpacity
                onPress={() => setPeso(p => String((parseFloat(p) || 0) + 2.5))}
                style={styles.inputBtn}
                activeOpacity={0.85}
              >
                <Text style={styles.inputBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputBlock}>
            <Text style={styles.inputLabel}>Repeticiones</Text>
            <View style={styles.inputWrapper}>
              <TouchableOpacity
                onPress={() => setReps(r => String(Math.max(1, (parseInt(r, 10) || 0) - 1)))}
                style={styles.inputBtn}
                activeOpacity={0.85}
              >
                <Text style={styles.inputBtnText}>−</Text>
              </TouchableOpacity>
              <TextInput
                style={styles.inputField}
                value={reps}
                onChangeText={setReps}
                keyboardType="numeric"
                selectTextOnFocus
              />
              <TouchableOpacity
                onPress={() => setReps(r => String((parseInt(r, 10) || 0) + 1))}
                style={styles.inputBtn}
                activeOpacity={0.85}
              >
                <Text style={styles.inputBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Nota opcional */}
        <TextInput
          style={[styles.notaInput, { backgroundColor: COLORS.bgCard, color: COLORS.text }]}
          value={notaSerie}
          onChangeText={setNotaSerie}
          placeholder="Nota (opcional)"
          placeholderTextColor={COLORS.textDim}
          maxLength={100}
        />
      </View>

      {/* Botón completar */}
      <TouchableOpacity
        style={[styles.btnCompletar, yaCompletada && styles.btnCompletarDone]}
        onPress={handleCompletar}
        activeOpacity={0.85}
        disabled={yaCompletada}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name="checkmark-circle" size={20} color="#FFF" />
          <Text style={styles.btnCompletarText}>
            {yaCompletada ? 'Serie guardada' : 'Serie completada'}
          </Text>
        </View>
      </TouchableOpacity>

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
    backgroundColor: COLORS.bgCard,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  btnCloseText: { color: COLORS.textMuted, fontSize: 16 },
  topProgreso: { color: COLORS.textMuted, fontSize: 14, fontWeight: '600' },
  progressBarBg: {
    height: 3,
    backgroundColor: COLORS.bgCard,
    marginHorizontal: 0,
  },
  progressBarFill: {
    height: 3,
    backgroundColor: COLORS.accent,
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 32,
    alignItems: 'center',
  },
  grupoTag: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  ejercicioNombre: {
    color: COLORS.text,
    fontSize: 30,
    fontWeight: '800',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 12,
  },
  tipoBadge: {
    backgroundColor: COLORS.accent + '20',
    borderRadius: 40,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tipoBadgeText: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  prBadge: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 40,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.warning,
  },
  prText: {
    color: COLORS.warning,
    fontSize: 13,
    fontWeight: '700',
  },
  serieContainer: { alignItems: 'center', marginBottom: 20 },
  serieLabel: { color: COLORS.textMuted, fontSize: 14, marginBottom: 4 },
  serieNumero: { color: COLORS.text, fontSize: 72, fontWeight: '800', fontFamily: 'Menlo', lineHeight: 80 },
  serieDe: { color: COLORS.textMuted, fontSize: 36 },
  dots: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 40,
    backgroundColor: COLORS.bgCard,
    borderRadius: 40,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.bgCard,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  dotDone: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  dotCurrent: {
    borderColor: COLORS.accent,
    backgroundColor: 'transparent',
  },
  inputsRow: {
    flexDirection: 'row',
    gap: 20,
    width: '100%',
  },
  inputBlock: { flex: 1 },
  inputLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgCard,
    borderRadius: 40,
    overflow: 'hidden',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputBtn: {
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  inputBtnText: {
    color: COLORS.textMuted,
    fontSize: 22,
    fontWeight: '300',
  },
  inputField: {
    flex: 1,
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    paddingVertical: 14,
  },
  btnCompletar: {
    margin: 24,
    backgroundColor: COLORS.accent,
    borderRadius: 40,
    paddingVertical: 22,
    alignItems: 'center',
    shadowColor: COLORS.accent,
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  btnCompletarDone: {
    backgroundColor: COLORS.success,
    shadowColor: COLORS.success,
  },
  btnCompletarText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
  },
  // Fin del entrenamiento
  trofeo: { fontSize: 72, marginBottom: 20 },
  completadoTitle: {
    color: COLORS.text,
    fontSize: 26,
    fontWeight: '800',
    fontStyle: 'italic',
    marginBottom: 10,
  },
  completadoSub: {
    color: COLORS.textMuted,
    fontSize: 16,
    marginBottom: 40,
  },
  btnVolver: {
    backgroundColor: COLORS.accent,
    borderRadius: 40,
    paddingVertical: 18,
    paddingHorizontal: 48,
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
    backgroundColor: COLORS.bgCard,
    borderRadius: 40,
    padding: 16,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  resumenValor: {
    fontSize: 18,
    fontWeight: '800',
  },
  resumenLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  notaInput: {
    width: '100%',
    borderRadius: 40,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    marginTop: 16,
  },
});
