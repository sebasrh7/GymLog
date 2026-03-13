import { Alert } from 'react-native';
import { getDatabase } from '../database/database';
import { Rutina, RutinaEjercicio, TipoSerie } from '../models';

export const rutinaService = {
  getAll: async (): Promise<Rutina[]> => {
    try {
      const db = await getDatabase();
      const [result] = await db.executeSql('SELECT * FROM rutinas ORDER BY nombre');
      const items: Rutina[] = [];
      for (let i = 0; i < result.rows.length; i++) {
        items.push(result.rows.item(i));
      }
      return items;
    } catch (error) {
      __DEV__ && console.error('Error al obtener rutinas:', error);
      Alert.alert('Error', 'No se pudieron cargar las rutinas.');
      return [];
    }
  },

  getById: async (id: number): Promise<Rutina | null> => {
    try {
      const db = await getDatabase();
      const [r] = await db.executeSql('SELECT * FROM rutinas WHERE id = ?', [id]);
      if (r.rows.length === 0) return null;

      const rutina: Rutina = { ...r.rows.item(0) };

      const [re] = await db.executeSql(
        `SELECT re.*, e.nombre as ejercicio_nombre, e.grupo_muscular
         FROM rutina_ejercicios re
         JOIN ejercicios e ON e.id = re.ejercicio_id
         WHERE re.rutina_id = ?
         ORDER BY re.orden`,
        [id],
      );

      const ejercicios: RutinaEjercicio[] = [];
      for (let i = 0; i < re.rows.length; i++) {
        ejercicios.push(re.rows.item(i));
      }
      rutina.ejercicios = ejercicios;
      return rutina;
    } catch (error) {
      __DEV__ && console.error('Error al obtener rutina:', error);
      Alert.alert('Error', 'No se pudo cargar la rutina.');
      return null;
    }
  },

  crear: async (nombre: string, dia_semana?: string): Promise<number> => {
    try {
      const db = await getDatabase();
      const [result] = await db.executeSql(
        'INSERT INTO rutinas (nombre, dia_semana) VALUES (?, ?)',
        [nombre, dia_semana ?? null],
      );
      return result.insertId;
    } catch (error) {
      __DEV__ && console.error('Error al crear rutina:', error);
      Alert.alert('Error', 'No se pudo crear la rutina.');
      throw error;
    }
  },

  actualizar: async (id: number, nombre: string, dia_semana?: string): Promise<void> => {
    try {
      const db = await getDatabase();
      await db.executeSql(
        'UPDATE rutinas SET nombre = ?, dia_semana = ? WHERE id = ?',
        [nombre, dia_semana ?? null, id],
      );
    } catch (error) {
      __DEV__ && console.error('Error al actualizar rutina:', error);
      Alert.alert('Error', 'No se pudo actualizar la rutina.');
      throw error;
    }
  },

  agregarEjercicio: async (
    rutinaId: number,
    ejercicioId: number,
    config: {
      orden: number;
      series: number;
      repeticiones: number;
      peso_objetivo: number;
      descanso: number;
      tipo_serie?: TipoSerie;
      grupo_serie?: number | null;
    },
  ): Promise<void> => {
    try {
      const db = await getDatabase();
      await db.executeSql(
        `INSERT INTO rutina_ejercicios
          (rutina_id, ejercicio_id, orden, series, repeticiones, peso_objetivo, descanso, tipo_serie, grupo_serie)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          rutinaId,
          ejercicioId,
          config.orden,
          config.series,
          config.repeticiones,
          config.peso_objetivo,
          config.descanso,
          config.tipo_serie ?? 'normal',
          config.grupo_serie ?? null,
        ],
      );
    } catch (error) {
      __DEV__ && console.error('Error al agregar ejercicio:', error);
      Alert.alert('Error', 'No se pudo agregar el ejercicio.');
      throw error;
    }
  },

  eliminarEjercicioDeRutina: async (rutinaEjercicioId: number): Promise<void> => {
    try {
      const db = await getDatabase();
      await db.executeSql('DELETE FROM rutina_ejercicios WHERE id = ?', [rutinaEjercicioId]);
    } catch (error) {
      __DEV__ && console.error('Error al eliminar ejercicio de rutina:', error);
      Alert.alert('Error', 'No se pudo eliminar el ejercicio.');
      throw error;
    }
  },

  duplicar: async (id: number): Promise<number> => {
    try {
      const db = await getDatabase();
      const [r] = await db.executeSql('SELECT * FROM rutinas WHERE id = ?', [id]);
      if (r.rows.length === 0) throw new Error('Rutina no encontrada');
      const original = r.rows.item(0);
      const [ins] = await db.executeSql(
        'INSERT INTO rutinas (nombre, dia_semana) VALUES (?, ?)',
        [`${original.nombre} (copia)`, original.dia_semana],
      );
      const newId = ins.insertId;
      const [ejs] = await db.executeSql(
        'SELECT * FROM rutina_ejercicios WHERE rutina_id = ? ORDER BY orden', [id],
      );
      for (let i = 0; i < ejs.rows.length; i++) {
        const ej = ejs.rows.item(i);
        await db.executeSql(
          `INSERT INTO rutina_ejercicios (rutina_id, ejercicio_id, orden, series, repeticiones, peso_objetivo, descanso, tipo_serie, grupo_serie)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [newId, ej.ejercicio_id, ej.orden, ej.series, ej.repeticiones, ej.peso_objetivo, ej.descanso, ej.tipo_serie ?? 'normal', ej.grupo_serie ?? null],
        );
      }
      return newId;
    } catch (error) {
      __DEV__ && console.error('Error al duplicar rutina:', error);
      Alert.alert('Error', 'No se pudo duplicar la rutina.');
      throw error;
    }
  },

  eliminar: async (id: number): Promise<void> => {
    try {
      const db = await getDatabase();
      await db.executeSql('DELETE FROM rutina_ejercicios WHERE rutina_id = ?', [id]);
      await db.executeSql('DELETE FROM rutinas WHERE id = ?', [id]);
    } catch (error) {
      __DEV__ && console.error('Error al eliminar rutina:', error);
      Alert.alert('Error', 'No se pudo eliminar la rutina.');
      throw error;
    }
  },
};
