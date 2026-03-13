import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  StyleSheet,
  ScrollView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Ejercicio } from '../models';
import { COLORS, globalStyles } from '../utils/theme';
import { useColors } from '../utils/ThemeContext';
import { capitalize } from '../utils/formatters';

const GRUPOS = ['pecho', 'espalda', 'pierna', 'hombro', 'bíceps', 'tríceps', 'core'];

interface Props {
  visible: boolean;
  ejercicios: Ejercicio[];
  seleccionadoIds?: number[];
  onSelect: (ejercicio: Ejercicio) => void;
  onClose: () => void;
}

export const EjercicioPickerModal: React.FC<Props> = ({
  visible,
  ejercicios,
  seleccionadoIds = [],
  onSelect,
  onClose,
}) => {
  const { colors } = useColors();
  const [busqueda, setBusqueda] = useState('');
  const [grupoFiltro, setGrupoFiltro] = useState<string | null>(null);

  const filtrados = useMemo(() => {
    return ejercicios.filter(e => {
      const matchBusqueda = e.nombre.toLowerCase().includes(busqueda.toLowerCase());
      const matchGrupo = !grupoFiltro || e.grupo_muscular === grupoFiltro;
      return matchBusqueda && matchGrupo;
    });
  }, [ejercicios, busqueda, grupoFiltro]);

  const handleClose = () => {
    setBusqueda('');
    setGrupoFiltro(null);
    onClose();
  };

  const renderItem = ({ item }: { item: Ejercicio }) => {
    const sel = seleccionadoIds.includes(item.id);
    return (
      <TouchableOpacity
        style={[
          styles.cell,
          { backgroundColor: colors.bgCard, borderColor: colors.border },
          sel && { borderColor: COLORS.accent, backgroundColor: 'rgba(255,0,0,0.05)' },
        ]}
        onPress={() => onSelect(item)}
        activeOpacity={0.85}
      >
        <View style={styles.cellLeft}>
          <Text style={[styles.cellName, { color: colors.text }]}>{item.nombre}</Text>
          <Text style={[styles.cellGrupo, { color: colors.textDim }]}>
            {capitalize(item.grupo_muscular)}
          </Text>
        </View>
        {sel ? (
          <View style={styles.checkCircle}>
            <Ionicons name="checkmark" size={14} color="#FFF" />
          </View>
        ) : (
          <Ionicons name="add-circle-outline" size={22} color={colors.textDim} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <SafeAreaView style={[globalStyles.container, { backgroundColor: colors.bg }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Ejercicios</Text>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleClose}
            style={[styles.closeBtn, { backgroundColor: colors.bgCard }]}
          >
            <Ionicons name="close" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchRow}>
          <View style={[styles.searchWrap, { backgroundColor: colors.bgCard }]}>
            <Ionicons name="search" size={16} color={colors.textDim} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              value={busqueda}
              onChangeText={setBusqueda}
              placeholder="Buscar..."
              placeholderTextColor={colors.textDim}
            />
            {busqueda.length > 0 && (
              <TouchableOpacity onPress={() => setBusqueda('')} activeOpacity={0.85}>
                <Ionicons name="close-circle" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Group filter */}
        <View style={styles.gruposWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.gruposScroll}
        >
          {GRUPOS.map(g => {
            const sel = grupoFiltro === g;
            return (
              <TouchableOpacity
                key={g}
                activeOpacity={0.85}
                style={[
                  styles.grupoChip,
                  sel
                    ? { backgroundColor: COLORS.accent }
                    : { backgroundColor: colors.bgCard },
                ]}
                onPress={() => setGrupoFiltro(sel ? null : g)}
              >
                <Text
                  style={[
                    styles.grupoChipText,
                    { color: sel ? '#FFF' : colors.textMuted },
                  ]}
                >
                  {capitalize(g)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        </View>

        {/* Count */}
        <Text style={[styles.countText, { color: colors.textDim }]}>
          {filtrados.length} ejercicio{filtrados.length !== 1 ? 's' : ''}
        </Text>

        {/* List */}
        <FlatList
          data={filtrados}
          keyExtractor={e => String(e.id)}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="search-outline" size={40} color={colors.textDim} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                Sin resultados
              </Text>
            </View>
          }
        />
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    fontStyle: 'italic',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Search
  searchRow: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    padding: 0,
  },

  // Grupo filter
  gruposWrap: {
    marginBottom: 10,
  },
  gruposScroll: {
    paddingLeft: 20,
    paddingRight: 20,
    gap: 6,
  },
  grupoChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  grupoChipText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Count
  countText: {
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 24,
    marginBottom: 6,
    letterSpacing: 0.3,
  },

  // List
  list: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  // Cell
  cell: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 6,
    borderWidth: 1,
  },
  cellLeft: {
    flex: 1,
    gap: 2,
  },
  cellName: {
    fontSize: 15,
    fontWeight: '700',
  },
  cellGrupo: {
    fontSize: 11,
    fontWeight: '600',
  },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Empty
  emptyWrap: {
    alignItems: 'center',
    marginTop: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
