import { Alert } from 'react-native';
import { getDatabase } from '../database/database';
import { Sesion, SerieRealizada } from '../models';

export const sesionService = {
  crear: async (rutinaId?: number): Promise<number> => {
    try {
      const db = await getDatabase();
      const fecha = new Date().toISOString();
      const [result] = await db.executeSql(
        'INSERT INTO sesiones (fecha, rutina_id) VALUES (?, ?)',
        [fecha, rutinaId ?? null],
      );
      return result.insertId;
    } catch (error) {
      console.error('Error al crear sesión:', error);
      Alert.alert('Error', 'No se pudo iniciar la sesión de entrenamiento.');
      throw error;
    }
  },

  guardarSerie: async (serie: SerieRealizada): Promise<void> => {
    try {
      const db = await getDatabase();
      await db.executeSql(
        `INSERT INTO series_realizadas
          (sesion_id, ejercicio_id, serie_numero, peso, reps, completado)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          serie.sesion_id,
          serie.ejercicio_id,
          serie.serie_numero,
          serie.peso,
          serie.reps,
          serie.completado ? 1 : 0,
        ],
      );
    } catch (error) {
      console.error('Error al guardar serie:', error);
      Alert.alert('Error', 'No se pudo guardar la serie. Intenta de nuevo.');
      throw error;
    }
  },

  getHistorial: async (): Promise<Sesion[]> => {
    try {
      const db = await getDatabase();
      const [result] = await db.executeSql(
        `SELECT s.*, r.nombre as rutina_nombre,
                COALESCE((SELECT COUNT(*) FROM series_realizadas sr WHERE sr.sesion_id = s.id AND sr.completado = 1), 0) as total_series,
                COALESCE((SELECT SUM(sr.peso * sr.reps) FROM series_realizadas sr WHERE sr.sesion_id = s.id AND sr.completado = 1), 0) as volumen_total
         FROM sesiones s
         LEFT JOIN rutinas r ON r.id = s.rutina_id
         ORDER BY s.fecha DESC`,
      );
      const items: Sesion[] = [];
      for (let i = 0; i < result.rows.length; i++) {
        items.push(result.rows.item(i));
      }
      return items;
    } catch (error) {
      console.error('Error al obtener historial:', error);
      Alert.alert('Error', 'No se pudo cargar el historial.');
      return [];
    }
  },

  getDetalle: async (sesionId: number): Promise<SerieRealizada[]> => {
    try {
      const db = await getDatabase();
      const [result] = await db.executeSql(
        `SELECT sr.*, e.nombre as ejercicio_nombre
         FROM series_realizadas sr
         JOIN ejercicios e ON e.id = sr.ejercicio_id
         WHERE sr.sesion_id = ?
         ORDER BY sr.ejercicio_id, sr.serie_numero`,
        [sesionId],
      );
      const items: SerieRealizada[] = [];
      for (let i = 0; i < result.rows.length; i++) {
        const row = result.rows.item(i);
        items.push({ ...row, completado: row.completado === 1 });
      }
      return items;
    } catch (error) {
      console.error('Error al obtener detalle de sesión:', error);
      Alert.alert('Error', 'No se pudo cargar el detalle de la sesión.');
      return [];
    }
  },

  getRecordPersonal: async (ejercicioId: number): Promise<{ peso: number; reps: number } | null> => {
    try {
      const db = await getDatabase();
      const [result] = await db.executeSql(
        `SELECT peso, reps FROM series_realizadas
         WHERE ejercicio_id = ? AND completado = 1
         ORDER BY peso DESC, reps DESC
         LIMIT 1`,
        [ejercicioId],
      );
      if (result.rows.length === 0) return null;
      const row = result.rows.item(0);
      return { peso: row.peso, reps: row.reps };
    } catch (error) {
      console.error('Error al obtener récord personal:', error);
      return null;
    }
  },

  getHistorialEjercicio: async (ejercicioId: number): Promise<{ fecha: string; peso: number; reps: number }[]> => {
    try {
      const db = await getDatabase();
      const [result] = await db.executeSql(
        `SELECT s.fecha, MAX(sr.peso) as peso, sr.reps
         FROM series_realizadas sr
         JOIN sesiones s ON s.id = sr.sesion_id
         WHERE sr.ejercicio_id = ? AND sr.completado = 1
         GROUP BY s.id
         ORDER BY s.fecha ASC`,
        [ejercicioId],
      );
      const items: { fecha: string; peso: number; reps: number }[] = [];
      for (let i = 0; i < result.rows.length; i++) {
        items.push(result.rows.item(i));
      }
      return items;
    } catch (error) {
      console.error('Error al obtener historial de ejercicio:', error);
      return [];
    }
  },

  finalizarSesion: async (sesionId: number, duracionSeg: number): Promise<void> => {
    try {
      const db = await getDatabase();
      await db.executeSql('UPDATE sesiones SET duracion_seg = ? WHERE id = ?', [duracionSeg, sesionId]);
    } catch (error) {
      console.error('Error al finalizar sesión:', error);
    }
  },

  getResumen: async (sesionId: number): Promise<{
    totalSeries: number;
    volumenTotal: number;
    ejercicios: number;
    duracionSeg: number;
  } | null> => {
    try {
      const db = await getDatabase();
      const [sesResult] = await db.executeSql('SELECT duracion_seg FROM sesiones WHERE id = ?', [sesionId]);
      const duracion = sesResult.rows.length > 0 ? sesResult.rows.item(0).duracion_seg ?? 0 : 0;
      const [result] = await db.executeSql(
        `SELECT COUNT(*) as total_series,
                SUM(peso * reps) as volumen,
                COUNT(DISTINCT ejercicio_id) as ejercicios
         FROM series_realizadas WHERE sesion_id = ? AND completado = 1`,
        [sesionId],
      );
      if (result.rows.length === 0) return null;
      const row = result.rows.item(0);
      return {
        totalSeries: row.total_series ?? 0,
        volumenTotal: row.volumen ?? 0,
        ejercicios: row.ejercicios ?? 0,
        duracionSeg: duracion,
      };
    } catch {
      return null;
    }
  },

  getCalendario: async (year: number, month: number): Promise<number[]> => {
    try {
      const db = await getDatabase();
      const from = `${year}-${String(month).padStart(2, '0')}-01`;
      const toMonth = month === 12 ? 1 : month + 1;
      const toYear = month === 12 ? year + 1 : year;
      const to = `${toYear}-${String(toMonth).padStart(2, '0')}-01`;
      const [result] = await db.executeSql(
        `SELECT DISTINCT CAST(strftime('%d', fecha) AS INTEGER) as dia
         FROM sesiones WHERE fecha >= ? AND fecha < ? ORDER BY dia`,
        [from, to],
      );
      const dias: number[] = [];
      for (let i = 0; i < result.rows.length; i++) {
        dias.push(result.rows.item(i).dia);
      }
      return dias;
    } catch {
      return [];
    }
  },

  eliminar: async (id: number): Promise<void> => {
    try {
      const db = await getDatabase();
      await db.executeSql('DELETE FROM series_realizadas WHERE sesion_id = ?', [id]);
      await db.executeSql('DELETE FROM sesiones WHERE id = ?', [id]);
    } catch (error) {
      console.error('Error al eliminar sesión:', error);
      Alert.alert('Error', 'No se pudo eliminar la sesión.');
      throw error;
    }
  },
};
