import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  Alert,
  Dimensions,
  RefreshControl,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { medidaService } from '../services/medidaService';
import { MedidaCorporal } from '../models/Medida';
import { COLORS, globalStyles } from '../utils/theme';
import { useColors } from '../utils/ThemeContext';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_HEIGHT = 160;

const CAMPOS: { key: keyof MedidaCorporal; label: string; unit: string }[] = [
  { key: 'peso', label: 'Peso', unit: 'kg' },
  { key: 'grasa_corporal', label: 'Grasa corporal', unit: '%' },
  { key: 'pecho', label: 'Pecho', unit: 'cm' },
  { key: 'cintura', label: 'Cintura', unit: 'cm' },
  { key: 'cadera', label: 'Cadera', unit: 'cm' },
  { key: 'brazo', label: 'Brazo', unit: 'cm' },
  { key: 'muslo', label: 'Muslo', unit: 'cm' },
];

export const MedidasScreen = () => {
  const { colors } = useColors();
  const [medidas, setMedidas] = useState<MedidaCorporal[]>([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [valores, setValores] = useState<Record<string, string>>({});
  const [nota, setNota] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [campoGrafica, setCampoGrafica] = useState<keyof MedidaCorporal>('peso');

  const cargar = useCallback(async () => {
    const data = await medidaService.getAll();
    setMedidas(data);
  }, []);

  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));

  const guardar = async () => {
    const tieneValor = CAMPOS.some(c => valores[c.key]?.trim());
    if (!tieneValor) {
      Alert.alert('Error', 'Ingresa al menos una medida');
      return;
    }
    setGuardando(true);
    try {
      await medidaService.crear({
        fecha: new Date().toISOString(),
        peso: valores.peso ? parseFloat(valores.peso) : null,
        grasa_corporal: valores.grasa_corporal ? parseFloat(valores.grasa_corporal) : null,
        pecho: valores.pecho ? parseFloat(valores.pecho) : null,
        cintura: valores.cintura ? parseFloat(valores.cintura) : null,
        cadera: valores.cadera ? parseFloat(valores.cadera) : null,
        brazo: valores.brazo ? parseFloat(valores.brazo) : null,
        muslo: valores.muslo ? parseFloat(valores.muslo) : null,
        nota: nota.trim() || null,
      });
      setValores({});
      setNota('');
      setMostrarModal(false);
      cargar();
    } catch {
      // error shown by service
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = (id: number) => {
    Alert.alert('Eliminar medida', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await medidaService.eliminar(id);
          cargar();
        },
      },
    ]);
  };

  // Data for mini chart (reversed to show chronological order)
  const datosGrafica = [...medidas]
    .reverse()
    .filter(m => (m[campoGrafica] as number | null | undefined) != null)
    .map(m => ({
      fecha: m.fecha,
      valor: m[campoGrafica] as number,
    }));

  const maxVal = datosGrafica.length > 0 ? Math.max(...datosGrafica.map(d => d.valor)) : 0;
  const minVal = datosGrafica.length > 0 ? Math.min(...datosGrafica.map(d => d.valor)) : 0;
  const range = maxVal - minVal || 1;

  const formatFecha = (fecha: string) => {
    const d = new Date(fecha);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  };

  const formatFechaLarga = (fecha: string) => {
    const d = new Date(fecha);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  };

  const campoInfo = CAMPOS.find(c => c.key === campoGrafica);

  return (
    <View style={[globalStyles.container, { backgroundColor: colors.bg }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={false} onRefresh={cargar} tintColor={colors.accent} />}
      >
        {/* Chart selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          {CAMPOS.map(c => {
            const sel = campoGrafica === c.key;
            return (
              <TouchableOpacity
                key={c.key}
                style={[styles.chip, { backgroundColor: sel ? colors.accent : colors.bgCard }]}
                onPress={() => setCampoGrafica(c.key)}
                activeOpacity={0.85}
              >
                <Text style={[styles.chipText, { color: sel ? '#FFF' : colors.textMuted }]}>
                  {c.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Chart */}
        {datosGrafica.length >= 2 ? (
          <View style={[styles.chartCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <Text style={[styles.chartTitle, { color: colors.text }]}>
              {campoInfo?.label} ({campoInfo?.unit})
            </Text>
            <View style={styles.chartContainer}>
              <View style={styles.yAxis}>
                <Text style={[styles.axisLabel, { color: colors.textDim }]}>{maxVal}</Text>
                <Text style={[styles.axisLabel, { color: colors.textDim }]}>{minVal}</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chartScroll}>
                <View style={styles.barsContainer}>
                  {datosGrafica.map((d, i) => {
                    const height = ((d.valor - minVal) / range) * (CHART_HEIGHT - 40) + 20;
                    return (
                      <View key={i} style={styles.barWrapper}>
                        <Text style={[styles.barValue, { color: colors.textMuted }]}>{d.valor}</Text>
                        <View style={[styles.bar, { height }]} />
                        <Text style={[styles.barLabel, { color: colors.textDim }]}>{formatFecha(d.fecha)}</Text>
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          </View>
        ) : (
          <View style={[styles.emptyChart, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            {/* Subtle grid background */}
            <View style={styles.gridOverlay}>
              {Array.from({ length: 5 }).map((_, i) => (
                <View key={`h-${i}`} style={[styles.gridLineH, { top: `${(i + 1) * 20}%` }]} />
              ))}
              {Array.from({ length: 7 }).map((_, i) => (
                <View key={`v-${i}`} style={[styles.gridLineV, { left: `${(i + 1) * 12.5}%` }]} />
              ))}
            </View>
            <Ionicons name="analytics-outline" size={36} color={colors.textDim} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              Registra al menos 2 medidas para ver la gráfica
            </Text>
          </View>
        )}

        {/* Latest values */}
        {medidas.length > 0 && (
          <View style={[styles.latestCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Última medida</Text>
            <Text style={[styles.fechaText, { color: colors.textMuted }]}>
              {formatFechaLarga(medidas[0].fecha)}
            </Text>
            <View style={styles.valoresGrid}>
              {CAMPOS.map(c => {
                const val = medidas[0][c.key] as number | null | undefined;
                if (val == null) return null;
                return (
                  <View key={c.key} style={[styles.valorItem, { backgroundColor: colors.bg }]}>
                    <Text style={[styles.valorNum, { color: colors.text }]}>{val}</Text>
                    <Text style={[styles.valorLabel, { color: colors.textMuted }]}>{c.label} ({c.unit})</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* History */}
        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 20 }]}>
          Historial ({medidas.length})
        </Text>
        {medidas.map(m => (
          <TouchableOpacity
            key={m.id}
            style={[styles.historialRow, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
            onLongPress={() => eliminar(m.id)}
            activeOpacity={0.85}
          >
            <Text style={[styles.histFecha, { color: colors.textMuted }]}>
              {formatFechaLarga(m.fecha)}
            </Text>
            <View style={styles.histValores}>
              {m.peso != null && <Text style={[styles.histVal, { color: colors.text }]}>{m.peso} kg</Text>}
              {m.grasa_corporal != null && <Text style={[styles.histVal, { color: colors.text }]}>{m.grasa_corporal}%</Text>}
              {m.pecho != null && <Text style={[styles.histVal, { color: colors.textMuted }]}>P:{m.pecho}</Text>}
              {m.cintura != null && <Text style={[styles.histVal, { color: colors.textMuted }]}>Ci:{m.cintura}</Text>}
              {m.brazo != null && <Text style={[styles.histVal, { color: colors.textMuted }]}>B:{m.brazo}</Text>}
            </View>
          </TouchableOpacity>
        ))}

        {medidas.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="body-outline" size={48} color={colors.textDim} />
            <Text style={[styles.emptyText, { color: colors.textMuted, marginTop: 12 }]}>
              Sin medidas registradas
            </Text>
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={[styles.fab, { shadowColor: colors.accent }]} onPress={() => setMostrarModal(true)} activeOpacity={0.85}>
        <Ionicons name="add" size={24} color="#FFF" style={{ marginRight: 8 }} />
        <Text style={styles.fabText}>Nueva medida</Text>
      </TouchableOpacity>

      {/* Modal nueva medida */}
      <Modal visible={mostrarModal} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Nueva medida</Text>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {CAMPOS.map(c => (
                <View key={c.key} style={styles.modalField}>
                  <Text style={[styles.modalLabel, { color: colors.textMuted }]}>
                    {c.label} ({c.unit})
                  </Text>
                  <TextInput
                    style={[styles.modalInput, { backgroundColor: colors.bg, color: colors.text }]}
                    value={valores[c.key] || ''}
                    onChangeText={v => setValores(prev => ({ ...prev, [c.key]: v }))}
                    keyboardType="numeric"
                    placeholder="—"
                    placeholderTextColor={colors.textDim}
                  />
                </View>
              ))}
              <View style={styles.modalField}>
                <Text style={[styles.modalLabel, { color: colors.textMuted }]}>Nota (opcional)</Text>
                <TextInput
                  style={[styles.modalInput, { backgroundColor: colors.bg, color: colors.text }]}
                  value={nota}
                  onChangeText={setNota}
                  placeholder="Ej: Después de desayunar"
                  placeholderTextColor={colors.textDim}
                />
              </View>
            </ScrollView>

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={[styles.btnCancelar, { borderColor: colors.border }]}
                onPress={() => { setMostrarModal(false); setValores({}); setNota(''); }}
                activeOpacity={0.85}
              >
                <Text style={[styles.btnCancelarText, { color: colors.textMuted }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnGuardar, guardando && { opacity: 0.6 }]}
                onPress={guardar}
                disabled={guardando}
                activeOpacity={0.85}
              >
                <Text style={styles.btnGuardarText}>
                  {guardando ? 'Guardando...' : 'Guardar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  scroll: { padding: 24, paddingBottom: 100 },
  chipRow: { marginBottom: 16 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 40,
    marginRight: 8,
  },
  chipText: { fontWeight: '600', fontSize: 13 },
  chartCard: { borderRadius: 40, padding: 20, marginBottom: 20, borderWidth: 1 },
  chartTitle: { fontSize: 16, fontWeight: '800', fontStyle: 'italic', marginBottom: 16 },
  chartContainer: { flexDirection: 'row', height: CHART_HEIGHT },
  yAxis: {
    width: 40,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: 8,
    paddingBottom: 20,
  },
  axisLabel: { fontSize: 11, fontFamily: 'Menlo' },
  chartScroll: { flex: 1 },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingBottom: 20,
  },
  barWrapper: { alignItems: 'center', width: 36 },
  bar: {
    width: 20,
    backgroundColor: COLORS.accent,
    borderRadius: 6,
    minHeight: 4,
  },
  barValue: { fontSize: 10, marginBottom: 4, fontFamily: 'Menlo' },
  barLabel: { fontSize: 10, marginTop: 6 },
  emptyChart: {
    borderRadius: 40,
    padding: 32,
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  gridLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  gridLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  emptyText: { fontSize: 14, textAlign: 'center' },
  latestCard: { borderRadius: 40, padding: 20, marginBottom: 8, borderWidth: 1 },
  sectionTitle: { fontSize: 16, fontWeight: '800', fontStyle: 'italic', marginBottom: 8 },
  fechaText: { fontSize: 13, marginBottom: 12 },
  valoresGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  valorItem: { borderRadius: 40, paddingHorizontal: 14, paddingVertical: 10, alignItems: 'center' },
  valorNum: { fontSize: 18, fontWeight: '800', fontFamily: 'Menlo' },
  valorLabel: { fontSize: 11, marginTop: 2 },
  historialRow: {
    borderRadius: 40,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
  },
  histFecha: { fontSize: 13, fontWeight: '600' },
  histValores: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  histVal: { fontSize: 13, fontWeight: '600', fontFamily: 'Menlo' },
  emptyState: { alignItems: 'center', marginTop: 40 },
  fab: {
    position: 'absolute',
    bottom: 32,
    left: 24,
    right: 24,
    backgroundColor: COLORS.accent,
    borderRadius: 40,
    paddingVertical: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
  },
  fabText: { color: '#FFF', fontSize: 17, fontWeight: '800', fontStyle: 'italic', letterSpacing: 0.3 },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: { borderRadius: 40, padding: 28, width: '90%', maxHeight: '80%', borderWidth: 1 },
  modalTitle: { fontSize: 20, fontWeight: '800', fontStyle: 'italic', marginBottom: 20 },
  modalScroll: { marginBottom: 16 },
  modalField: { marginBottom: 12 },
  modalLabel: { fontSize: 13, marginBottom: 6 },
  modalInput: {
    borderRadius: 40,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  modalBtns: { flexDirection: 'row', gap: 12 },
  btnCancelar: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 40,
    alignItems: 'center',
    borderWidth: 1,
  },
  btnCancelarText: { fontWeight: '600', fontSize: 15 },
  btnGuardar: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 40,
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    shadowColor: COLORS.accent,
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  btnGuardarText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
});
