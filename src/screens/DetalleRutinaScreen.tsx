import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { rutinaService } from '../services/rutinaService';
import { Rutina } from '../models';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS, globalStyles } from '../utils/theme';
import { useColors } from '../utils/ThemeContext';
import { capitalize } from '../utils/formatters';
import { useToast } from '../components/Toast';

export const DetalleRutinaScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { rutinaId } = route.params;
  const { colors } = useColors();
  const toast = useToast();
  const [rutina, setRutina] = useState<Rutina | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const cargar = async () => {
        setLoading(true);
        const r = await rutinaService.getById(rutinaId);
        setRutina(r);
        if (r) navigation.setOptions({ title: r.nombre });
        setLoading(false);
      };
      cargar();
    }, [rutinaId]),
  );

  if (loading) {
    return (
      <View style={[globalStyles.center, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!rutina) return null;

  return (
    <View style={[globalStyles.container, { backgroundColor: colors.bg }]}>
      <FlatList
        data={rutina.ejercicios ?? []}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            {rutina.dia_semana ? (
              <Text style={[styles.dia, { color: colors.accent }]}>{capitalize(rutina.dia_semana)}</Text>
            ) : null}
            <Text style={[styles.titulo, { color: colors.text }]}>{rutina.nombre}</Text>
            <Text style={[styles.count, { color: colors.textMuted }]}>
              {rutina.ejercicios?.length ?? 0} ejercicios
            </Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
            onPress={() => navigation.navigate('Estadisticas', {
              ejercicioId: item.ejercicio_id,
              ejercicioNombre: item.ejercicio_nombre,
            })}
            activeOpacity={0.85}
          >
            <View style={[styles.cardLeft, { backgroundColor: colors.bg }]}>
              <Text style={[styles.orden, { color: colors.accent }]}>{index + 1}</Text>
            </View>
            <View style={styles.cardBody}>
              <Text style={[styles.ejercicioNombre, { color: colors.text }]}>{item.ejercicio_nombre}</Text>
              <Text style={[styles.grupo, { color: colors.textMuted }]}>{capitalize(item.grupo_muscular)}</Text>
            </View>
            <View style={styles.cardRight}>
              <Text style={[styles.stat, { color: colors.text }]}>{item.series} × {item.repeticiones}</Text>
              <Text style={[styles.statSub, { color: colors.textMuted }]}>
                {item.peso_objetivo > 0 ? `${item.peso_objetivo} kg` : 'Sin peso'}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 }}>
                <Ionicons name="time-outline" size={12} color={colors.textMuted} />
                <Text style={[styles.statSub, { marginTop: 0, color: colors.textMuted }]}>{item.descanso}s</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />

      <View style={styles.bottomButtons}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.btnDuplicar, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
          onPress={() => {
            Alert.alert('Duplicar rutina', `¿Crear una copia de "${rutina.nombre}"?`, [
              { text: 'Cancelar', style: 'cancel' },
              {
                text: 'Duplicar',
                onPress: async () => {
                  await rutinaService.duplicar(rutinaId);
                  toast.show('Rutina duplicada');
                },
              },
            ]);
          }}
        >
          <Ionicons name="copy-outline" size={20} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.btnEditar, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
          onPress={() => navigation.navigate('EditarRutina', { rutinaId })}
        >
          <Text style={[styles.btnEditarText, { color: colors.text }]}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.btnIniciar, { backgroundColor: colors.accent }]}
          onPress={() => navigation.navigate('Entrenamiento', { rutinaId })}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="play" size={16} color="#FFF" />
            <Text style={styles.btnIniciarText}>Iniciar</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  list: { padding: 24, paddingBottom: 130 },
  header: { marginBottom: 24 },
  dia: { fontSize: 13, fontWeight: '800', fontStyle: 'italic', textTransform: 'uppercase', marginBottom: 4 },
  titulo: { fontSize: 26, fontWeight: '800', fontStyle: 'italic' },
  count: { fontSize: 14, marginTop: 4, fontFamily: 'Menlo' },
  card: {
    borderRadius: 40,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  cardLeft: {
    width: 36,
    height: 36,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  orden: { fontWeight: '800', fontSize: 15, fontFamily: 'Menlo' },
  cardBody: { flex: 1 },
  ejercicioNombre: { fontSize: 15, fontWeight: '600' },
  grupo: { fontSize: 12, marginTop: 2 },
  cardRight: { alignItems: 'flex-end' },
  stat: { fontWeight: '700', fontSize: 15, fontFamily: 'Menlo' },
  statSub: { fontSize: 12, marginTop: 2, fontFamily: 'Menlo' },
  bottomButtons: {
    position: 'absolute',
    bottom: 32,
    left: 24,
    right: 24,
    flexDirection: 'row',
    gap: 12,
  },
  btnDuplicar: {
    borderRadius: 40,
    paddingVertical: 18,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  btnEditar: {
    flex: 1,
    borderRadius: 40,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 1,
  },
  btnEditarText: { fontSize: 16, fontWeight: '800', fontStyle: 'italic' },
  btnIniciar: {
    flex: 2,
    borderRadius: 40,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: COLORS.accent,
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  btnIniciarText: { color: '#FFF', fontSize: 16, fontWeight: '800', fontStyle: 'italic' },
});
