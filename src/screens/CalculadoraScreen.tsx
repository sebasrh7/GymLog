import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useColors } from '../utils/ThemeContext';
import { useUnidad } from '../utils/UnidadContext';
import { weightIncrement } from '../utils/conversion';
import { COLORS, globalStyles } from '../utils/theme';

const PERCENTAGES = [100, 95, 90, 85, 80, 75, 70, 65, 60];

export const CalculadoraScreen = () => {
  const { colors } = useColors();
  const { unidad } = useUnidad();
  const [peso, setPeso] = useState('');
  const [reps, setReps] = useState('');
  const [resultado, setResultado] = useState<number | null>(null);

  const calcular = () => {
    const pesoNum = parseFloat(peso);
    const repsNum = parseInt(reps, 10);
    if (isNaN(pesoNum) || pesoNum <= 0 || isNaN(repsNum) || repsNum < 1) {
      return;
    }
    const oneRM = pesoNum * (1 + repsNum / 30);
    setResultado(oneRM);
  };

  const repsFromPercent = (pct: number): string => {
    if (pct >= 100) return '1';
    const r = 30 * (100 / pct - 1);
    return Math.round(r).toString();
  };

  return (
    <View style={[globalStyles.container, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="calculator" size={28} color={colors.accent} />
          <Text style={[styles.title, { color: colors.text }]}>
            Calculadora 1RM
          </Text>
        </View>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Fórmula de Epley · Estimación de repetición máxima
        </Text>

        {/* Input fields */}
        <View style={styles.inputsRow}>
          <View style={styles.inputBlock}>
            <Text style={[styles.inputLabel, { color: colors.textMuted }]}>
              PESO ({unidad.toUpperCase()})
            </Text>
            <View style={[styles.inputBox, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              <TouchableOpacity
                onPress={() => setPeso(p => String(Math.max(0, (parseFloat(p) || 0) - weightIncrement(unidad))))}
                style={styles.inputBtn}
                activeOpacity={0.85}
              >
                <Ionicons name="remove" size={20} color={colors.textMuted} />
              </TouchableOpacity>
              <TextInput
                style={[styles.inputField, { color: colors.text }]}
                value={peso}
                onChangeText={setPeso}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.textDim}
                selectTextOnFocus
              />
              <TouchableOpacity
                onPress={() => setPeso(p => String((parseFloat(p) || 0) + weightIncrement(unidad)))}
                style={styles.inputBtn}
                activeOpacity={0.85}
              >
                <Ionicons name="add" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputBlock}>
            <Text style={[styles.inputLabel, { color: colors.textMuted }]}>
              REPETICIONES
            </Text>
            <View style={[styles.inputBox, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              <TouchableOpacity
                onPress={() => setReps(r => String(Math.max(1, (parseInt(r, 10) || 0) - 1)))}
                style={styles.inputBtn}
                activeOpacity={0.85}
              >
                <Ionicons name="remove" size={20} color={colors.textMuted} />
              </TouchableOpacity>
              <TextInput
                style={[styles.inputField, { color: colors.text }]}
                value={reps}
                onChangeText={setReps}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.textDim}
                selectTextOnFocus
              />
              <TouchableOpacity
                onPress={() => setReps(r => String((parseInt(r, 10) || 0) + 1))}
                style={styles.inputBtn}
                activeOpacity={0.85}
              >
                <Ionicons name="add" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Calcular button */}
        <TouchableOpacity
          style={[styles.btnCalcular, { shadowColor: colors.accent }]}
          onPress={calcular}
          activeOpacity={0.85}
        >
          <Ionicons name="flash" size={22} color="#FFF" />
          <Text style={styles.btnCalcularText}>Calcular</Text>
        </TouchableOpacity>

        {/* Result */}
        {resultado !== null && (
          <>
            <View style={styles.resultSection}>
              <Text style={[styles.resultLabel, { color: colors.textMuted }]}>
                TU 1RM ESTIMADO
              </Text>
              <Text style={styles.resultValue}>
                {resultado.toFixed(1)}
              </Text>
              <Text style={[styles.resultUnit, { color: colors.textMuted }]}>
                {unidad.toUpperCase()}
              </Text>
            </View>

            {/* Percentage table */}
            <View style={[styles.tableCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              <Text style={[styles.tableTitle, { color: colors.text }]}>
                Tabla de porcentajes
              </Text>

              {/* Table header */}
              <View style={[styles.tableHeaderRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.tableHeaderCell, { color: colors.textDim }]}>%1RM</Text>
                <Text style={[styles.tableHeaderCell, { color: colors.textDim, textAlign: 'center' }]}>PESO</Text>
                <Text style={[styles.tableHeaderCell, { color: colors.textDim, textAlign: 'right' }]}>REPS</Text>
              </View>

              {/* Table rows */}
              {PERCENTAGES.map((pct) => {
                const pesoEst = (resultado * pct) / 100;
                const is100 = pct === 100;
                return (
                  <View
                    key={pct}
                    style={[
                      styles.tableRow,
                      { borderBottomColor: colors.border },
                      is100 && styles.tableRowHighlight,
                    ]}
                  >
                    <Text style={[styles.tableCellPct, { color: is100 ? COLORS.accent : colors.textMuted }]}>
                      {pct}%
                    </Text>
                    <Text style={[styles.tableCellWeight, { color: is100 ? COLORS.accent : colors.text }]}>
                      {pesoEst.toFixed(1)} {unidad}
                    </Text>
                    <Text style={[styles.tableCellReps, { color: is100 ? COLORS.accent : colors.textMuted }]}>
                      {pct === 100 ? '1' : `~${repsFromPercent(pct)}`}
                    </Text>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  scroll: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
    marginTop: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    fontStyle: 'italic',
  },
  subtitle: {
    fontSize: 13,
    marginBottom: 28,
    fontFamily: 'Menlo',
  },
  inputsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  inputBlock: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 10,
  },
  inputBox: {
    flexDirection: 'row',
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
    borderWidth: 1,
    height: 72,
  },
  inputBtn: {
    paddingHorizontal: 16,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputField: {
    flex: 1,
    fontSize: 28,
    fontWeight: '800',
    fontFamily: 'Menlo',
    textAlign: 'center',
  },
  btnCalcular: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 40,
    paddingVertical: 22,
    marginBottom: 32,
    backgroundColor: COLORS.accent,
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 12,
  },
  btnCalcularText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 0.3,
  },
  resultSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  resultLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  resultValue: {
    fontSize: 64,
    fontWeight: '800',
    fontStyle: 'italic',
    color: COLORS.accent,
    fontFamily: 'Menlo',
    lineHeight: 72,
  },
  resultUnit: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 2,
    marginTop: 4,
  },
  tableCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
  },
  tableTitle: {
    fontSize: 16,
    fontWeight: '800',
    fontStyle: 'italic',
    marginBottom: 16,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    paddingBottom: 10,
    borderBottomWidth: 1,
    marginBottom: 4,
  },
  tableHeaderCell: {
    flex: 1,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    fontFamily: 'Menlo',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tableRowHighlight: {
    backgroundColor: 'rgba(255,0,0,0.06)',
    borderRadius: 8,
    marginHorizontal: -4,
    paddingHorizontal: 4,
  },
  tableCellPct: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Menlo',
  },
  tableCellWeight: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    fontFamily: 'Menlo',
    textAlign: 'center',
  },
  tableCellReps: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Menlo',
    textAlign: 'right',
  },
});
