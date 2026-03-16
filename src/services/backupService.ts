import { Alert } from 'react-native';
import { getDatabase } from '../database/database';
import RNFS from 'react-native-fs';
import { preferences } from '../utils/preferences';
import { fromDb } from '../utils/conversion';

const TABLAS = [
  'ejercicios',
  'rutinas',
  'rutina_ejercicios',
  'sesiones',
  'series_realizadas',
];

export const backupService = {
  exportar: async (): Promise<string> => {
    try {
      const db = await getDatabase();
      const backup: Record<string, any[]> = {};

      for (const tabla of TABLAS) {
        const [result] = await db.executeSql(`SELECT * FROM ${tabla}`);
        const rows: any[] = [];
        for (let i = 0; i < result.rows.length; i++) {
          rows.push(result.rows.item(i));
        }
        backup[tabla] = rows;
      }

      const json = JSON.stringify(
        { version: 1, fecha: new Date().toISOString(), datos: backup },
        null,
        2,
      );

      const path = `${RNFS.DocumentDirectoryPath}/gymlog_backup_${Date.now()}.json`;
      await RNFS.writeFile(path, json, 'utf8');
      return path;
    } catch (error) {
      __DEV__ && console.error('Error al exportar backup:', error);
      Alert.alert('Error', 'No se pudo crear el backup.');
      throw error;
    }
  },

  exportarCSV: async (): Promise<string> => {
    try {
      const db = await getDatabase();
      const [result] = await db.executeSql(`
        SELECT s.fecha, r.nombre as rutina, e.nombre as ejercicio, e.grupo_muscular,
               sr.serie_numero, sr.peso, sr.reps, sr.completado, s.duracion_seg
        FROM series_realizadas sr
        JOIN sesiones s ON s.id = sr.sesion_id
        JOIN ejercicios e ON e.id = sr.ejercicio_id
        LEFT JOIN rutinas r ON r.id = s.rutina_id
        ORDER BY s.fecha DESC, sr.ejercicio_id, sr.serie_numero
      `);

      const rows: any[] = [];
      for (let i = 0; i < result.rows.length; i++) {
        rows.push(result.rows.item(i));
      }

      const unidad = await preferences.getUnidad();
      const header = `Fecha,Rutina,Ejercicio,Grupo Muscular,Serie,Peso (${unidad}),Reps,Completado,Duración (min)`;
      const csvRows = rows.map(row => {
        const duracionMin = row.duracion_seg != null
          ? (row.duracion_seg / 60).toFixed(1)
          : '';
        return [
          row.fecha ?? '',
          row.rutina ?? '',
          row.ejercicio ?? '',
          row.grupo_muscular ?? '',
          row.serie_numero ?? '',
          row.peso != null ? parseFloat(fromDb(row.peso, unidad).toFixed(1)) : '',
          row.reps ?? '',
          row.completado ?? '',
          duracionMin,
        ].join(',');
      });

      const csv = [header, ...csvRows].join('\n');
      const path = `${RNFS.DocumentDirectoryPath}/gymlog_export_${Date.now()}.csv`;
      await RNFS.writeFile(path, csv, 'utf8');
      return path;
    } catch (error) {
      __DEV__ && console.error('Error al exportar CSV:', error);
      Alert.alert('Error', 'No se pudo exportar a CSV.');
      throw error;
    }
  },

  importar: async (rutaArchivo: string): Promise<void> => {
    try {
      const db = await getDatabase();
      const json = await RNFS.readFile(rutaArchivo, 'utf8');
      const { datos } = JSON.parse(json);

      await db.transaction(async (tx) => {
        // Limpiar en orden inverso (respetando FK)
        tx.executeSql('DELETE FROM series_realizadas');
        tx.executeSql('DELETE FROM sesiones');
        tx.executeSql('DELETE FROM rutina_ejercicios');
        tx.executeSql('DELETE FROM rutinas');
        tx.executeSql('DELETE FROM ejercicios');

        for (const tabla of TABLAS) {
          if (datos[tabla]?.length > 0) {
            for (const row of datos[tabla]) {
              const cols = Object.keys(row).join(', ');
              const placeholders = Object.keys(row).map(() => '?').join(', ');
              const vals = Object.values(row);
              tx.executeSql(
                `INSERT INTO ${tabla} (${cols}) VALUES (${placeholders})`,
                vals as any[],
              );
            }
          }
        }
      });
    } catch (error) {
      __DEV__ && console.error('Error al importar backup:', error);
      Alert.alert('Error', 'No se pudo restaurar el backup. El archivo puede estar corrupto.');
      throw error;
    }
  },
};
