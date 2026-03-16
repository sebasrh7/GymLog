import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Modal,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { EjercicioActivo, TIPO_SERIE_LABELS } from '../models';
import { COLORS } from '../utils/theme';
import { useColors } from '../utils/ThemeContext';
import { capitalize } from '../utils/formatters';
import { useUnidad } from '../utils/UnidadContext';
import { displayWeight } from '../utils/conversion';

const DESCANSO_OPTIONS = [30, 60, 90, 120, 180];

interface Props {
  ea: EjercicioActivo;
  ejIndex: number;
  isFirst: boolean;
  isLast: boolean;
  isActive: boolean;
  isCompleted: boolean;
  onCompletarSerie: (ejIndex: number, serieIndex: number) => void;
  onUpdateSerie: (ejIndex: number, serieIndex: number, field: 'peso' | 'reps', value: string) => void;
  onAgregarSerie: (ejIndex: number) => void;
  onRemoveSerie: (ejIndex: number, serieIndex: number) => void;
  onDescansoChange: (ejIndex: number, seconds: number) => void;
  onReorder: (ejIndex: number, direction: 'up' | 'down') => void;
  onToggleCollapse: (ejIndex: number) => void;
  onRemoveEjercicio: (ejIndex: number) => void;
  onDescompletarSerie: (ejIndex: number, serieIndex: number) => void;
}

export const EjercicioWorkoutCard = React.memo(({
  ea,
  ejIndex,
  isFirst,
  isLast,
  isActive,
  isCompleted,
  onCompletarSerie,
  onUpdateSerie,
  onAgregarSerie,
  onRemoveSerie,
  onDescansoChange,
  onReorder,
  onToggleCollapse,
  onRemoveEjercicio,
  onDescompletarSerie,
}: Props) => {
  const { colors } = useColors();
  const { unidad } = useUnidad();
  const [menuVisible, setMenuVisible] = useState(false);
  const completadas = ea.series.filter(s => s.completada).length;
  const total = ea.series.length;

  const borderColor = isActive
    ? COLORS.accent
    : isCompleted
      ? COLORS.success
      : colors.border;

  return (
    <View style={[
      styles.card,
      { backgroundColor: colors.bgCard, borderColor },
      isActive && styles.cardActive,
    ]}>
      {/* Header */}
      <TouchableOpacity
        style={styles.header}
        onPress={() => onToggleCollapse(ejIndex)}
        activeOpacity={0.85}
      >
        <View style={{ flex: 1 }}>
          <Text style={[styles.grupoTag, { color: colors.accent }]}>
            {capitalize(ea.ejercicio.grupo_muscular)}
          </Text>
          <View style={styles.nombreRow}>
            <Text style={[styles.nombre, { color: colors.text }]} numberOfLines={1}>
              {ea.ejercicio.nombre}
            </Text>
            {ea.tipoSerie !== 'normal' && (
              <View style={[styles.tipoBadge, { borderColor: colors.accent }]}>
                <Text style={[styles.tipoBadgeText, { color: colors.accent }]}>
                  {TIPO_SERIE_LABELS[ea.tipoSerie]}
                </Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.headerActions}>
          {/* Completed check */}
          {isCompleted && (
            <View style={styles.completedBadge}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
            </View>
          )}
          {/* Progress when collapsed */}
          {ea.collapsed && !isCompleted && (
            <Text style={[styles.progressText, { color: colors.textMuted }]}>
              {completadas}/{total}
            </Text>
          )}
          {/* Menu button */}
          <TouchableOpacity
            onPress={() => setMenuVisible(true)}
            activeOpacity={0.85}
            style={[styles.menuBtn, { backgroundColor: colors.bgInput }]}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Ionicons name="ellipsis-vertical" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {/* Context menu */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View style={[styles.menuCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            {!isFirst && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => { setMenuVisible(false); onReorder(ejIndex, 'up'); }}
                activeOpacity={0.85}
              >
                <Ionicons name="arrow-up" size={18} color={colors.text} />
                <Text style={[styles.menuText, { color: colors.text }]}>Mover arriba</Text>
              </TouchableOpacity>
            )}
            {!isLast && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => { setMenuVisible(false); onReorder(ejIndex, 'down'); }}
                activeOpacity={0.85}
              >
                <Ionicons name="arrow-down" size={18} color={colors.text} />
                <Text style={[styles.menuText, { color: colors.text }]}>Mover abajo</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => { setMenuVisible(false); onToggleCollapse(ejIndex); }}
              activeOpacity={0.85}
            >
              <Ionicons name={ea.collapsed ? 'eye-outline' : 'eye-off-outline'} size={18} color={colors.text} />
              <Text style={[styles.menuText, { color: colors.text }]}>
                {ea.collapsed ? 'Expandir' : 'Saltar'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => { setMenuVisible(false); onRemoveEjercicio(ejIndex); }}
              activeOpacity={0.85}
            >
              <Ionicons name="trash-outline" size={18} color={COLORS.accent} />
              <Text style={[styles.menuText, { color: COLORS.accent }]}>Eliminar ejercicio</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Progress badge when collapsed */}
      {ea.collapsed && (
        <View style={styles.collapsedInfo}>
          <Text style={[styles.collapsedText, { color: colors.textMuted }]}>
            {completadas}/{total} series
          </Text>
          {ea.recordPersonal && (
            <Text style={[styles.collapsedPR, { color: colors.warning }]}>
              PR: {displayWeight(ea.recordPersonal.peso, unidad)}{unidad} x {ea.recordPersonal.reps}
            </Text>
          )}
        </View>
      )}

      {/* Expanded content */}
      {!ea.collapsed && (
        <>
          {/* PR Badge */}
          {ea.recordPersonal && (
            <View style={[styles.prBadge, { borderColor: colors.warning }]}>
              <Ionicons name="trophy" size={12} color={colors.warning} />
              <Text style={[styles.prText, { color: colors.warning }]}>
                PR: {displayWeight(ea.recordPersonal.peso, unidad)}{unidad} x {ea.recordPersonal.reps}
              </Text>
            </View>
          )}

          {/* Descanso selector */}
          <View style={styles.descansoRow}>
            <Ionicons name="timer-outline" size={14} color={colors.textMuted} />
            {DESCANSO_OPTIONS.map((sec) => {
              const selected = ea.descanso === sec;
              const label = sec >= 60 ? `${sec / 60}m` : `${sec}s`;
              return (
                <TouchableOpacity
                  key={sec}
                  style={[
                    styles.descansoChip,
                    { backgroundColor: selected ? COLORS.accent : colors.bgInput },
                  ]}
                  onPress={() => onDescansoChange(ejIndex, sec)}
                  activeOpacity={0.85}
                >
                  <Text style={[
                    styles.descansoChipText,
                    { color: selected ? '#FFF' : colors.textMuted },
                  ]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Column headers */}
          <View style={styles.headerRow}>
            <Text style={[styles.headerText, { width: 32, color: colors.textDim }]}>Serie</Text>
            <Text style={[styles.headerText, { flex: 1, color: colors.textDim }]}>Anterior</Text>
            <Text style={[styles.headerText, { flex: 1, color: colors.textDim }]}>Peso ({unidad})</Text>
            <Text style={[styles.headerText, { flex: 1, color: colors.textDim }]}>Reps</Text>
            <View style={{ width: 36 }} />
          </View>

          {/* Series */}
          {ea.series.map((serie, serieIndex) => (
            <View
              key={serieIndex}
              style={[styles.serieRow, serie.completada && styles.serieRowDone]}
            >
              <Text style={[styles.serieNumero, { color: colors.text }]}>
                {serieIndex + 1}
              </Text>
              {/* Anterior reference */}
              <Text style={[styles.anteriorText, { color: colors.textDim }]} numberOfLines={1}>
                {serie.pesoAnterior != null
                  ? `${parseFloat(serie.pesoAnterior.toFixed(1))}x${serie.repsAnterior}`
                  : '—'}
              </Text>
              <TextInput
                style={[
                  styles.serieInput,
                  { backgroundColor: colors.bgInput, color: colors.text },
                  serie.completada && { backgroundColor: colors.border },
                ]}
                value={serie.peso}
                onChangeText={v => onUpdateSerie(ejIndex, serieIndex, 'peso', v)}
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
                onChangeText={v => onUpdateSerie(ejIndex, serieIndex, 'reps', v)}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.textDim}
                editable={!serie.completada}
                selectTextOnFocus
              />
              {serie.completada ? (
                <TouchableOpacity
                  style={[styles.btnCheck, styles.btnCheckDone]}
                  onPress={() => onDescompletarSerie(ejIndex, serieIndex)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="checkmark" size={18} color="#FFF" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.btnCheck, { backgroundColor: colors.bgInput }]}
                  onPress={() => onCompletarSerie(ejIndex, serieIndex)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="checkmark" size={18} color={COLORS.textMuted} />
                </TouchableOpacity>
              )}
            </View>
          ))}

          {/* Add/Remove serie buttons */}
          <View style={styles.serieActions}>
            <TouchableOpacity
              style={styles.btnAgregarSerie}
              onPress={() => onAgregarSerie(ejIndex)}
              activeOpacity={0.85}
            >
              <Ionicons name="add" size={16} color={colors.accent} />
              <Text style={[styles.btnSerieText, { color: colors.accent }]}>Serie</Text>
            </TouchableOpacity>
            {ea.series.length > 1 && ea.series.some(s => !s.completada) && (
              <TouchableOpacity
                style={styles.btnAgregarSerie}
                onPress={() => {
                  // Remove last uncompleted serie
                  const lastIdx = ea.series.map((s, i) => ({ s, i })).reverse().find(x => !x.s.completada);
                  if (lastIdx) onRemoveSerie(ejIndex, lastIdx.i);
                }}
                activeOpacity={0.85}
              >
                <Ionicons name="remove" size={16} color={colors.textMuted} />
                <Text style={[styles.btnSerieText, { color: colors.textMuted }]}>Serie</Text>
              </TouchableOpacity>
            )}
          </View>
        </>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  cardActive: {
    borderWidth: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  grupoTag: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  nombreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  nombre: {
    fontSize: 18,
    fontWeight: '800',
    fontStyle: 'italic',
    flexShrink: 1,
  },
  tipoBadge: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  tipoBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 4,
    marginLeft: 8,
  },
  completedBadge: {
    marginRight: -2,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Menlo',
  },
  menuBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Menu
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuCard: {
    borderRadius: 20,
    padding: 8,
    minWidth: 220,
    borderWidth: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuText: {
    fontSize: 15,
    fontWeight: '600',
  },

  // Collapsed
  collapsedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
    paddingLeft: 2,
  },
  collapsedText: {
    fontSize: 13,
    fontWeight: '600',
  },
  collapsedPR: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Menlo',
  },

  // PR Badge
  prBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginTop: 8,
    marginBottom: 4,
  },
  prText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Menlo',
  },

  // Descanso
  descansoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  descansoChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  descansoChipText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Menlo',
  },

  // Column headers
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
    gap: 8,
  },
  headerText: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    textTransform: 'uppercase',
  },

  // Series
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
  anteriorText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Menlo',
  },
  serieInput: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Menlo',
    textAlign: 'center',
  },
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

  // Serie actions
  serieActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 4,
  },
  btnAgregarSerie: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 4,
  },
  btnSerieText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
