import { Alert } from 'react-native';
import { getDatabase } from '../database/database';
import { MedidaCorporal } from '../models/Medida';

export const medidaService = {
  getAll: async (): Promise<MedidaCorporal[]> => {
    try {
      const db = await getDatabase();
      const [result] = await db.executeSql(
        'SELECT * FROM medidas_corporales ORDER BY fecha DESC',
      );
      const items: MedidaCorporal[] = [];
      for (let i = 0; i < result.rows.length; i++) {
        items.push(result.rows.item(i));
      }
      return items;
    } catch (error) {
      console.error('Error al obtener medidas:', error);
      return [];
    }
  },

  crear: async (medida: Omit<MedidaCorporal, 'id'>): Promise<number> => {
    try {
      const db = await getDatabase();
      const [result] = await db.executeSql(
        `INSERT INTO medidas_corporales (fecha, peso, grasa_corporal, pecho, cintura, cadera, brazo, muslo, nota)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          medida.fecha,
          medida.peso ?? null,
          medida.grasa_corporal ?? null,
          medida.pecho ?? null,
          medida.cintura ?? null,
          medida.cadera ?? null,
          medida.brazo ?? null,
          medida.muslo ?? null,
          medida.nota ?? null,
        ],
      );
      return result.insertId;
    } catch (error) {
      console.error('Error al crear medida:', error);
      Alert.alert('Error', 'No se pudo guardar la medida.');
      throw error;
    }
  },

  eliminar: async (id: number): Promise<void> => {
    try {
      const db = await getDatabase();
      await db.executeSql('DELETE FROM medidas_corporales WHERE id = ?', [id]);
    } catch (error) {
      console.error('Error al eliminar medida:', error);
      Alert.alert('Error', 'No se pudo eliminar la medida.');
      throw error;
    }
  },

  getUltima: async (): Promise<MedidaCorporal | null> => {
    try {
      const db = await getDatabase();
      const [result] = await db.executeSql(
        'SELECT * FROM medidas_corporales ORDER BY fecha DESC LIMIT 1',
      );
      if (result.rows.length === 0) return null;
      return result.rows.item(0);
    } catch {
      return null;
    }
  },
};
