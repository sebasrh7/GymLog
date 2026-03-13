import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { rutinaService } from '../services/rutinaService';
import { ejercicioService } from '../services/ejercicioService';
import { useEjercicios } from '../hooks';
import { EjercicioCard } from '../components/EjercicioCard';
import { EjercicioPickerModal } from '../components/EjercicioPickerModal';
import { COLORS, globalStyles } from '../utils/theme';
import { useColors } from '../utils/ThemeContext';
import { Ejercicio, TipoSerie, TIPO_SERIE_LABELS } from '../models';

const DIAS = [
  'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo',
];

const TIPOS_SERIE: TipoSerie[] = ['normal', 'superserie', 'dropset', 'rest_pause'];
const TIPO_ICONS: Record<TipoSerie, string> = {
  normal: 'fitness-outline',
  superserie: 'flash-outline',
  dropset: 'trending-down-outline',
  rest_pause: 'pause-outline',
};

interface EjercicioConfig {
  ejercicio: Ejercicio;
  series: string;
  repeticiones: string;
  pesoObjetivo: string;
  descanso: string;
  tipoSerie: TipoSerie;
}

export const CrearRutinaScreen = () => {
  const { colors } = useColors();
  const navigation = useNavigation<any>();
  const { ejercicios } = useEjercicios();

  const [nombre, setNombre] = useState('');
  const [nombreFocused, setNombreFocused] = useState(false);
  const [dia, setDia] = useState('');
  const [mostrarBiblioteca, setMostrarBiblioteca] = useState(false);
  const [ejerciciosConfig, setEjerciciosConfig] = useState<EjercicioConfig[]>([]);
  const [guardando, setGuardando] = useState(false);

  const agregarEjercicio = (ej: Ejercicio) => {
    if (ejerciciosConfig.find(e => e.ejercicio.id === ej.id)) return;
    setEjerciciosConfig(prev => [
      ...prev,
      {
        ejercicio: ej,
        series: '3',
        repeticiones: '10',
        pesoObjetivo: '0',
        descanso: '90',
        tipoSerie: 'normal',
      },
    ]);
    setMostrarBiblioteca(false);
  };

  const eliminarEjercicio = (id: number) => {
    setEjerciciosConfig(prev => prev.filter(e => e.ejercicio.id !== id));
  };

  const moverEjercicio = (index: number, direction: 'up' | 'down') => {
    setEjerciciosConfig(prev => {
      const arr = [...prev];
      const target = direction === 'up' ? index - 1 : index + 1;
      if (target < 0 || target >= arr.length) return prev;
      [arr[index], arr[target]] = [arr[target], arr[index]];
      return arr;
    });
  };

  const actualizarConfig = (
    id: number,
    campo: keyof Omit<EjercicioConfig, 'ejercicio'>,
    valor: string,
  ) => {
    setEjerciciosConfig(prev =>
      prev.map(e =>
        e.ejercicio.id === id ? { ...e, [campo]: valor } : e,
      ),
    );
  };

  const guardar = async () => {
    if (!nombre.trim()) {
      Alert.alert('Error', 'El nombre de la rutina es obligatorio');
      return;
    }
    if (ejerciciosConfig.length === 0) {
      Alert.alert('Error', 'Agrega al menos un ejercicio');
      return;
    }

    setGuardando(true);
    try {
      const rutinaId = await rutinaService.crear(nombre.trim(), dia || undefined);
      let grupoSerieCounter = 1;
      const grupoSerieMap: (number | null)[] = ejerciciosConfig.map(() => null);
      for (let i = 0; i < ejerciciosConfig.length - 1; i++) {
        if (ejerciciosConfig[i].tipoSerie === 'superserie' && ejerciciosConfig[i + 1].tipoSerie === 'superserie') {
          if (grupoSerieMap[i] === null) { grupoSerieMap[i] = grupoSerieCounter; }
          grupoSerieMap[i + 1] = grupoSerieMap[i];
        } else if (ejerciciosConfig[i].tipoSerie === 'superserie' && grupoSerieMap[i] === null) {
          grupoSerieMap[i] = grupoSerieCounter;
          grupoSerieMap[i + 1] = grupoSerieCounter;
          grupoSerieCounter++;
        }
      }

      for (let i = 0; i < ejerciciosConfig.length; i++) {
        const cfg = ejerciciosConfig[i];
        const descansoDefault = cfg.tipoSerie === 'dropset' ? 0 : cfg.tipoSerie === 'rest_pause' ? 15 : 90;
        await rutinaService.agregarEjercicio(rutinaId, cfg.ejercicio.id, {
          orden: i,
          series: parseInt(cfg.series, 10) || 3,
          repeticiones: parseInt(cfg.repeticiones, 10) || 10,
          peso_objetivo: parseFloat(cfg.pesoObjetivo) || 0,
          descanso: parseInt(cfg.descanso, 10) || descansoDefault,
          tipo_serie: cfg.tipoSerie,
          grupo_serie: grupoSerieMap[i],
        });
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', 'No se pudo guardar la rutina');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <View style={[globalStyles.container, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Nombre — underline style */}
        <Text style={[styles.label, { color: colors.textMuted }]}>NOMBRE DE LA RUTINA</Text>
        <View style={styles.nameInputWrap}>
          <TextInput
            style={[styles.nameInput, { color: colors.text }]}
            placeholder="Ej: Pecho y tríceps"
            placeholderTextColor={colors.textDim}
            value={nombre}
            onChangeText={setNombre}
            onFocus={() => setNombreFocused(true)}
            onBlur={() => setNombreFocused(false)}
          />
          <View
            style={[
              styles.nameUnderline,
              { backgroundColor: nombreFocused ? COLORS.accent : colors.border },
            ]}
          />
        </View>

        {/* Día — pill chips */}
        <Text style={[styles.label, { color: colors.textMuted, marginTop: 28 }]}>DÍA DE LA SEMANA</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.diasRow}>
          {DIAS.map(d => {
            const sel = dia === d;
            return (
              <TouchableOpacity
                key={d}
                activeOpacity={0.85}
                style={[
                  styles.diaChip,
                  { backgroundColor: sel ? COLORS.accent : '#2C2C2E' },
                ]}
                onPress={() => setDia(dia === d ? '' : d)}
              >
                <Text style={[styles.diaChipText, { color: sel ? '#FFF' : colors.textMuted }]}>
                  {d.substring(0, 3)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Ejercicios header */}
        <View style={styles.seccionHeader}>
          <Text style={[styles.seccionTitle, { color: colors.text }]}>
            Ejercicios ({ejerciciosConfig.length})
          </Text>
        </View>

        {ejerciciosConfig.map((cfg, index) => (
          <View key={cfg.ejercicio.id} style={[styles.ejercicioCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <View style={styles.ejercicioHeader}>
              <Text style={styles.ejercicioOrden}>{index + 1}</Text>
              <Text style={[styles.ejercicioNombre, { color: colors.text }]} numberOfLines={1}>
                {cfg.ejercicio.nombre}
              </Text>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => moverEjercicio(index, 'up')}
                disabled={index === 0}
                style={{ padding: 4, opacity: index === 0 ? 0.3 : 1 }}
              >
                <Ionicons name="chevron-up-outline" size={18} color={colors.textDim} />
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => moverEjercicio(index, 'down')}
                disabled={index === ejerciciosConfig.length - 1}
                style={{ padding: 4, opacity: index === ejerciciosConfig.length - 1 ? 0.3 : 1 }}
              >
                <Ionicons name="chevron-down-outline" size={18} color={colors.textDim} />
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.85} onPress={() => eliminarEjercicio(cfg.ejercicio.id)} style={{ padding: 4 }}>
                <Ionicons name="close" size={20} color={colors.textDim} />
              </TouchableOpacity>
            </View>

            <View style={styles.configRow}>
              {[
                { label: 'Series', key: 'series' as const },
                { label: 'Reps', key: 'repeticiones' as const },
                { label: 'Peso kg', key: 'pesoObjetivo' as const },
                { label: 'Desc. s', key: 'descanso' as const },
              ].map(({ label, key }) => (
                <View key={key} style={styles.configItem}>
                  <Text style={[styles.configLabel, { color: colors.textMuted }]}>{label}</Text>
                  <TextInput
                    style={[styles.configInput, { backgroundColor: colors.bg, color: colors.text }]}
                    value={cfg[key]}
                    onChangeText={v => actualizarConfig(cfg.ejercicio.id, key, v)}
                    keyboardType="numeric"
                    selectTextOnFocus
                  />
                </View>
              ))}
            </View>

            {/* Tipo de serie */}
            <View style={styles.tipoRow}>
              {TIPOS_SERIE.map(tipo => {
                const sel = cfg.tipoSerie === tipo;
                return (
                  <TouchableOpacity
                    key={tipo}
                    activeOpacity={0.85}
                    style={[
                      styles.tipoChip,
                      { backgroundColor: sel ? COLORS.accent : colors.bg },
                    ]}
                    onPress={() => {
                      setEjerciciosConfig(prev =>
                        prev.map(e =>
                          e.ejercicio.id === cfg.ejercicio.id
                            ? {
                                ...e,
                                tipoSerie: tipo,
                                descanso: tipo === 'dropset' ? '0' : tipo === 'rest_pause' ? '15' : e.descanso === '0' || e.descanso === '15' ? '90' : e.descanso,
                              }
                            : e,
                        ),
                      );
                    }}
                  >
                    <Ionicons
                      name={TIPO_ICONS[tipo]}
                      size={14}
                      color={sel ? '#FFF' : colors.textMuted}
                    />
                    <Text style={[styles.tipoChipText, { color: sel ? '#FFF' : colors.textMuted }]}>
                      {TIPO_SERIE_LABELS[tipo]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        {/* Add exercise — full width button */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.btnAgregar, { borderColor: colors.accent }]}
          onPress={() => setMostrarBiblioteca(true)}
        >
          <View style={styles.btnAgregarIconWrap}>
            <Ionicons name="add" size={28} color={COLORS.accent} />
          </View>
          <Text style={styles.btnAgregarText}>Agregar ejercicio</Text>
        </TouchableOpacity>

        {/* Save */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.btnGuardar, guardando && { opacity: 0.6 }]}
          onPress={guardar}
          disabled={guardando}
        >
          <Text style={styles.btnGuardarText}>
            {guardando ? 'Guardando...' : 'Guardar rutina'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <EjercicioPickerModal
        visible={mostrarBiblioteca}
        ejercicios={ejercicios}
        seleccionadoIds={ejerciciosConfig.map(c => c.ejercicio.id)}
        onSelect={agregarEjercicio}
        onClose={() => setMostrarBiblioteca(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  scroll: { padding: 24, paddingBottom: 60 },

  // Label
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 12,
  },

  // Name input — underline style
  nameInputWrap: {
    marginBottom: 4,
  },
  nameInput: {
    fontSize: 22,
    fontWeight: '800',
    fontStyle: 'italic',
    paddingVertical: 12,
    paddingHorizontal: 0,
  },
  nameUnderline: {
    height: 2,
    borderRadius: 1,
  },

  // Day chips
  diasRow: { marginBottom: 24 },
  diaChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 40,
    marginRight: 8,
  },
  diaChipText: {
    fontWeight: '700',
    fontSize: 13,
  },

  // Section
  seccionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    marginTop: 4,
  },
  seccionTitle: {
    fontSize: 16,
    fontWeight: '800',
    fontStyle: 'italic',
  },

  // Exercise card
  ejercicioCard: {
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
  },
  ejercicioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ejercicioOrden: {
    color: COLORS.accent,
    fontWeight: '800',
    fontSize: 16,
    width: 28,
    fontFamily: 'Menlo',
  },
  ejercicioNombre: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  configRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  configItem: { flex: 1 },
  configLabel: { fontSize: 10, fontWeight: '600', marginBottom: 4 },
  configInput: {
    borderRadius: 12,
    textAlign: 'center',
    paddingVertical: 10,
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Menlo',
  },
  tipoRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  tipoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 40,
  },
  tipoChipText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Add exercise button
  btnAgregar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 20,
    paddingVertical: 18,
    marginBottom: 8,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  btnAgregarIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnAgregarText: {
    color: COLORS.accent,
    fontWeight: '700',
    fontSize: 15,
  },

  // Save button
  btnGuardar: {
    backgroundColor: COLORS.accent,
    borderRadius: 40,
    paddingVertical: 22,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: COLORS.accent,
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
  },
  btnGuardarText: { color: '#FFF', fontSize: 17, fontWeight: '800', fontStyle: 'italic', letterSpacing: 0.3 },

});
