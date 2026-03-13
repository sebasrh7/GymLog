import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, globalStyles } from '../utils/theme';
import { useColors } from '../utils/ThemeContext';
import { getPlantillas, crearDesdeTemplate, Plantilla } from '../services/plantillaService';

export const PlantillasScreen = () => {
  const { colors } = useColors();
  const navigation = useNavigation();
  const plantillas = getPlantillas();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const toggleExpand = (index: number) => {
    setExpandedIndex(prev => (prev === index ? null : index));
  };

  const handleCrear = async (plantilla: Plantilla) => {
    setLoading(true);
    try {
      await crearDesdeTemplate(plantilla);
      Alert.alert(
        'Listo',
        `Se crearon las rutinas de "${plantilla.nombre}" correctamente.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    } catch {
      // Error already handled by the service
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[globalStyles.container, { backgroundColor: colors.bg }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.header, { color: colors.text }]}>Plantillas</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Elige una plantilla predefinida para crear tus rutinas automáticamente.
        </Text>

        {plantillas.map((plantilla, index) => {
          const expanded = expandedIndex === index;

          return (
            <View
              key={plantilla.nombre}
              style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
            >
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => toggleExpand(index)}
              >
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>
                      {plantilla.nombre}
                    </Text>
                    <Text style={[styles.cardDesc, { color: colors.textMuted }]}>
                      {plantilla.descripcion}
                    </Text>
                    <View style={styles.badgeRow}>
                      <View style={[styles.badge, { backgroundColor: colors.bgInput }]}>
                        <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
                        <Text style={[styles.badgeText, { color: colors.textMuted }]}>
                          {plantilla.dias.length} {plantilla.dias.length === 1 ? 'día' : 'días'}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <Ionicons
                    name={expanded ? 'chevron-up' : 'chevron-down'}
                    size={22}
                    color={colors.textMuted}
                  />
                </View>
              </TouchableOpacity>

              {expanded && (
                <View style={styles.expandedContent}>
                  {plantilla.dias.map(dia => (
                    <View
                      key={dia.nombre}
                      style={[styles.diaBlock, { borderColor: colors.border }]}
                    >
                      <Text style={[styles.diaTitle, { color: colors.text }]}>
                        {dia.nombre}
                      </Text>
                      {dia.ejercicios.map((ej, ejIdx) => (
                        <View key={ejIdx} style={styles.ejercicioRow}>
                          <Ionicons
                            name="barbell-outline"
                            size={14}
                            color={colors.textDim}
                          />
                          <Text style={[styles.ejercicioText, { color: colors.textMuted }]}>
                            {ej.nombre}
                          </Text>
                          <Text style={[styles.ejercicioDetail, { color: colors.textDim }]}>
                            {ej.series}x{ej.repeticiones}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ))}

                  <TouchableOpacity
                    style={[styles.btnCrear, { opacity: loading ? 0.6 : 1 }]}
                    onPress={() => handleCrear(plantilla)}
                    disabled={loading}
                    activeOpacity={0.85}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFF" size="small" />
                    ) : (
                      <>
                        <Ionicons name="download-outline" size={18} color="#FFF" />
                        <Text style={styles.btnCrearText}>Crear rutinas</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  header: {
    fontSize: 22,
    fontWeight: '800',
    fontStyle: 'italic',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 24,
    lineHeight: 20,
  },
  card: {
    borderRadius: 40,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    fontStyle: 'italic',
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 10,
  },
  badgeRow: {
    flexDirection: 'row',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 40,
    gap: 5,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  expandedContent: {
    marginTop: 16,
  },
  diaBlock: {
    borderTopWidth: 1,
    paddingTop: 14,
    marginBottom: 12,
  },
  diaTitle: {
    fontSize: 15,
    fontWeight: '800',
    fontStyle: 'italic',
    marginBottom: 10,
  },
  ejercicioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  ejercicioText: {
    flex: 1,
    fontSize: 13,
  },
  ejercicioDetail: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Menlo',
  },
  btnCrear: {
    backgroundColor: COLORS.accent,
    borderRadius: 40,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    shadowColor: COLORS.accent,
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  btnCrearText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
