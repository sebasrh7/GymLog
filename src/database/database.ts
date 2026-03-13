import SQLite, { SQLiteDatabase } from 'react-native-sqlite-storage';
import { runMigrations } from './migrations';
import { seedEjercicios } from './seed';

SQLite.enablePromise(true);

let db: SQLiteDatabase | null = null;
let initPromise: Promise<SQLiteDatabase> | null = null;

export const getDatabase = (): Promise<SQLiteDatabase> => {
  if (db) return Promise.resolve(db);

  // Si ya hay una inicialización en curso, devolver la misma promesa
  // para evitar queries concurrentes contra una BD a medio inicializar
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const instance = await SQLite.openDatabase({
        name: 'gymlog.db',
        location: 'default',
      });

      await runMigrations(instance);
      await seedEjercicios(instance);

      db = instance;
      return db;
    } catch (error) {
      // Resetear para permitir reintentos
      initPromise = null;
      throw error;
    }
  })();

  return initPromise;
};
