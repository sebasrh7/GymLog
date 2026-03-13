import { Alert } from 'react-native';
import { getDatabase } from '../database/database';
import { Ejercicio } from '../models';

export const ejercicioService = {
  getAll: async (): Promise<Ejercicio[]> => {
    try {
      const db = await getDatabase();
      const [result] = await db.executeSql(
        'SELECT * FROM ejercicios ORDER BY grupo_muscular, nombre',
      );
      const items: Ejercicio[] = [];
      for (let i = 0; i < result.rows.length; i++) {
        items.push(result.rows.item(i));
      }
      return items;
    } catch (error) {
      __DEV__ && console.error('Error al obtener ejercicios:', error);
      Alert.alert('Error', 'No se pudieron cargar los ejercicios.');
      return [];
    }
  },

  getByGrupo: async (grupo: string): Promise<Ejercicio[]> => {
    try {
      const db = await getDatabase();
      const [result] = await db.executeSql(
        'SELECT * FROM ejercicios WHERE grupo_muscular = ? ORDER BY nombre',
        [grupo],
      );
      const items: Ejercicio[] = [];
      for (let i = 0; i < result.rows.length; i++) {
        items.push(result.rows.item(i));
      }
      return items;
    } catch (error) {
      __DEV__ && console.error('Error al filtrar ejercicios:', error);
      Alert.alert('Error', 'No se pudieron cargar los ejercicios.');
      return [];
    }
  },

  getGrupos: async (): Promise<string[]> => {
    try {
      const db = await getDatabase();
      const [result] = await db.executeSql(
        'SELECT DISTINCT grupo_muscular FROM ejercicios ORDER BY grupo_muscular',
      );
      const grupos: string[] = [];
      for (let i = 0; i < result.rows.length; i++) {
        grupos.push(result.rows.item(i).grupo_muscular);
      }
      return grupos;
    } catch (error) {
      __DEV__ && console.error('Error al obtener grupos:', error);
      return [];
    }
  },

  crear: async (nombre: string, grupo_muscular: string): Promise<number> => {
    try {
      const db = await getDatabase();
      const [result] = await db.executeSql(
        'INSERT INTO ejercicios (nombre, grupo_muscular, personalizado) VALUES (?, ?, 1)',
        [nombre, grupo_muscular],
      );
      return result.insertId;
    } catch (error) {
      __DEV__ && console.error('Error al crear ejercicio:', error);
      Alert.alert('Error', 'No se pudo crear el ejercicio.');
      throw error;
    }
  },

  eliminar: async (id: number): Promise<void> => {
    try {
      const db = await getDatabase();
      await db.executeSql('DELETE FROM ejercicios WHERE id = ? AND personalizado = 1', [id]);
    } catch (error) {
      __DEV__ && console.error('Error al eliminar ejercicio:', error);
      Alert.alert('Error', 'No se pudo eliminar el ejercicio.');
      throw error;
    }
  },
};
