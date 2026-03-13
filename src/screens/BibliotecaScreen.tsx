import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { useEjercicios } from '../hooks';
import { ejercicioService } from '../services/ejercicioService';
import { EjercicioCard } from '../components/EjercicioCard';
import { COLORS, globalStyles } from '../utils/theme';
import { useColors } from '../utils/ThemeContext';
import { capitalize } from '../utils/formatters';

const GRUPOS = ['pecho', 'espalda', 'pierna', 'hombro', 'bíceps', 'tríceps', 'core'];

interface Props {
  seleccionables?: boolean;
  seleccionados?: number[];
  onSeleccionar?: (id: number) => void;
}

export const BibliotecaScreen: React.FC<Props> = ({
  seleccionables = false,
  seleccionados = [],
  onSeleccionar,
}) => {
  const { colors } = useColors();
  const [busqueda, setBusqueda] = useState('');
  const [grupoFiltro, setGrupoFiltro] = useState<string | null>(null);
  const { ejercicios, grupos, loading, recargar } = useEjercicios();
  const [mostrarCrear, setMostrarCrear] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoGrupo, setNuevoGrupo] = useState('');

  const filtrados = ejercicios.filter(e => {
    const matchBusqueda = e.nombre
      .toLowerCase()
      .includes(busqueda.toLowerCase());
    const matchGrupo = !grupoFiltro || e.grupo_muscular === grupoFiltro;
    return matchBusqueda && matchGrupo;
  });

  const crearEjercicio = async () => {
    if (!nuevoNombre.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio');
      return;
    }
    if (!nuevoGrupo) {
      Alert.alert('Error', 'Selecciona un grupo muscular');
      return;
    }
    try {
      await ejercicioService.crear(nuevoNombre.trim(), nuevoGrupo);
      setNuevoNombre('');
      setNuevoGrupo('');
      setMostrarCrear(false);
      recargar();
    } catch {
      // Error ya mostrado por el servicio
    }
  };

  const confirmarEliminar = (id: number, nombre: string) => {
    Alert.alert('Eliminar ejercicio', `¿Eliminar "${nombre}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await ejercicioService.eliminar(id);
          recargar();
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={globalStyles.center}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  return (
    <View style={[globalStyles.container, { backgroundColor: colors.bg }]}>
      {/* Buscador */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.search}
          placeholder="Buscar ejercicio..."
          placeholderTextColor={COLORS.textMuted}
          value={busqueda}
          onChangeText={setBusqueda}
        />
      </View>

      {/* Filtros por grupo */}
      <FlatList
        horizontal
        data={['todos', ...grupos]}
        keyExtractor={g => g}
        contentContainerStyle={styles.filtros}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => {
          const activo =
            item === 'todos' ? grupoFiltro === null : grupoFiltro === item;
          return (
            <TouchableOpacity
              style={[styles.chip, activo && styles.chipActivo]}
              onPress={() =>
                setGrupoFiltro(item === 'todos' ? null : item)
              }
              activeOpacity={0.85}
            >
              <Text style={[styles.chipText, activo && styles.chipTextoActivo]}>
                {item === 'todos' ? 'Todos' : capitalize(item)}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      {/* Lista */}
      <FlatList
        data={filtrados}
        keyExtractor={e => String(e.id)}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={styles.empty}>No hay ejercicios con ese filtro</Text>
        }
        renderItem={({ item }) => (
          <EjercicioCard
            ejercicio={item}
            seleccionado={seleccionados.includes(item.id)}
            onPress={() => onSeleccionar?.(item.id)}
            onLongPress={item.personalizado ? () => confirmarEliminar(item.id, item.nombre) : undefined}
          />
        )}
      />

      {/* Botón crear ejercicio */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setMostrarCrear(true)}
        activeOpacity={0.85}
      >
        <Text style={styles.fabText}>+ Nuevo ejercicio</Text>
      </TouchableOpacity>

      {/* Modal crear ejercicio */}
      <Modal visible={mostrarCrear} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Nuevo ejercicio</Text>

            <Text style={styles.label}>Nombre</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Hip thrust"
              placeholderTextColor={COLORS.textMuted}
              value={nuevoNombre}
              onChangeText={setNuevoNombre}
            />

            <Text style={[styles.label, { marginTop: 16 }]}>Grupo muscular</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gruposRow}>
              {GRUPOS.map(g => (
                <TouchableOpacity
                  key={g}
                  style={[styles.grupoChip, nuevoGrupo === g && styles.grupoChipActivo]}
                  onPress={() => setNuevoGrupo(g)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.grupoChipText, nuevoGrupo === g && styles.grupoChipTextActivo]}>
                    {capitalize(g)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.btnCancelar}
                onPress={() => { setMostrarCrear(false); setNuevoNombre(''); setNuevoGrupo(''); }}
                activeOpacity={0.85}
              >
                <Text style={styles.btnCancelarText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnCrear} onPress={crearEjercicio} activeOpacity={0.85}>
                <Text style={styles.btnCrearText}>Crear</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  searchContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  search: {
    backgroundColor: COLORS.bgCard,
    color: COLORS.text,
    borderRadius: 40,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filtros: {
    paddingHorizontal: 24,
    paddingBottom: 12,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 40,
    backgroundColor: COLORS.bgCard,
    marginRight: 8,
  },
  chipActivo: {
    backgroundColor: COLORS.accent,
  },
  chipText: {
    color: COLORS.textMuted,
    fontWeight: '600',
    fontSize: 13,
  },
  chipTextoActivo: {
    color: '#FFF',
  },
  list: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  empty: {
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 40,
    fontSize: 15,
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    left: 24,
    right: 24,
    backgroundColor: COLORS.accent,
    borderRadius: 40,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: COLORS.accent,
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  fabText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 40,
    padding: 28,
    width: '88%',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '800',
    fontStyle: 'italic',
    marginBottom: 20,
  },
  label: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.bg,
    color: COLORS.text,
    borderRadius: 40,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  gruposRow: { marginBottom: 4 },
  grupoChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 40,
    backgroundColor: COLORS.bg,
    marginRight: 8,
    marginBottom: 16,
  },
  grupoChipActivo: { backgroundColor: COLORS.accent },
  grupoChipText: { color: COLORS.textMuted, fontWeight: '600', fontSize: 13 },
  grupoChipTextActivo: { color: '#FFF' },
  modalBtns: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  btnCancelar: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  btnCancelarText: { color: COLORS.textMuted, fontWeight: '600', fontSize: 15 },
  btnCrear: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 40,
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    shadowColor: COLORS.accent,
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  btnCrearText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
});
