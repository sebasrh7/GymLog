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
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Ejercicio } from '../models';
import { ejercicioService } from '../services/ejercicioService';
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
  onEjercicioCreado?: () => void;
}

export const EjercicioPickerModal: React.FC<Props> = ({
  visible,
  ejercicios,
  seleccionadoIds = [],
  onSelect,
  onClose,
  onEjercicioCreado,
}) => {
  const { colors } = useColors();
  const [busqueda, setBusqueda] = useState('');
  const [grupoFiltro, setGrupoFiltro] = useState<string | null>(null);
  const [creando, setCreando] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoGrupo, setNuevoGrupo] = useState('');

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
    setCreando(false);
    setNuevoNombre('');
    setNuevoGrupo('');
    onClose();
  };

  const handleCrear = async () => {
    if (!nuevoNombre.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio');
      return;
    }
    if (!nuevoGrupo) {
      Alert.alert('Error', 'Selecciona un grupo muscular');
      return;
    }
    try {
      const id = await ejercicioService.crear(nuevoNombre.trim(), nuevoGrupo);
      setCreando(false);
      setNuevoNombre('');
      setNuevoGrupo('');
      onEjercicioCreado?.();
      // Select the newly created exercise
      onSelect({ id, nombre: nuevoNombre.trim(), grupo_muscular: nuevoGrupo, personalizado: true });
    } catch {
      Alert.alert('Error', 'No se pudo crear el ejercicio');
    }
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
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleClose}
            style={[styles.closeBtn, { backgroundColor: colors.bgCard }]}
          >
            <Ionicons name="close" size={20} color={colors.textMuted} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Ejercicios</Text>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setCreando(!creando)}
            style={[styles.createBtn, { backgroundColor: creando ? COLORS.accent : colors.bgCard }]}
          >
            <Ionicons name={creando ? 'chevron-up' : 'add'} size={18} color={creando ? '#FFF' : colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Create form */}
        {creando && (
          <View style={[styles.createForm, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <Text style={[styles.createLabel, { color: colors.textMuted }]}>Nuevo ejercicio</Text>
            <TextInput
              style={[styles.createInput, { backgroundColor: colors.bg, color: colors.text }]}
              value={nuevoNombre}
              onChangeText={setNuevoNombre}
              placeholder="Nombre del ejercicio"
              placeholderTextColor={colors.textDim}
              autoFocus
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.createGruposScroll}
            >
              {GRUPOS.map(g => {
                const sel = nuevoGrupo === g;
                return (
                  <TouchableOpacity
                    key={g}
                    activeOpacity={0.85}
                    style={[
                      styles.createGrupoChip,
                      { backgroundColor: sel ? COLORS.accent : colors.bg },
                    ]}
                    onPress={() => setNuevoGrupo(sel ? '' : g)}
                  >
                    <Text style={[styles.createGrupoText, { color: sel ? '#FFF' : colors.textMuted }]}>
                      {capitalize(g)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.createSaveBtn, (!nuevoNombre.trim() || !nuevoGrupo) && { opacity: 0.4 }]}
              onPress={handleCrear}
              disabled={!nuevoNombre.trim() || !nuevoGrupo}
            >
              <Text style={styles.createSaveText}>Crear y agregar</Text>
            </TouchableOpacity>
          </View>
        )}

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
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.emptyCreateBtn}
                onPress={() => {
                  setCreando(true);
                  setNuevoNombre(busqueda);
                }}
              >
                <Ionicons name="add" size={16} color={COLORS.accent} />
                <Text style={styles.emptyCreateText}>Crear ejercicio</Text>
              </TouchableOpacity>
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
  createBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Create form
  createForm: {
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 10,
  },
  createLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  createInput: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '600',
  },
  createGruposScroll: {
    gap: 6,
  },
  createGrupoChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
  },
  createGrupoText: {
    fontSize: 12,
    fontWeight: '700',
  },
  createSaveBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  createSaveText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
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
  emptyCreateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  emptyCreateText: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: '700',
  },
});
